import { createHash } from "crypto";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import OpenAI from "openai";
import Redis from "ioredis";
import { NextResponse } from "next/server";
import { PERSONA_OPTIONS } from "@/data/personas";
import { PERSONA_TRANSACTIONS } from "@/data/transactions";
import { CardMetadata, calculateCardValue } from "@/lib/calculator";
import { RankCandidate, rankCandidates } from "@/lib/ranking";
import { aggregateAnnualTotals } from "@/lib/spend";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../.env") });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARD_IDS_KEY = "cards:ids";
const CARD_KEY = (id: string) => `card:${id}`;
const MODEL = "text-embedding-3-small";

function floatsFromBuffer(buf: Buffer): number[] {
  const out: number[] = [];
  for (let i = 0; i + 4 <= buf.length; i += 4) {
    out.push(buf.readFloatLE(i));
  }
  return out;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

function projectTo3D(vectors: number[][]): { x: number; y: number; z: number }[] {
  if (!vectors.length) return [];
  const dims = vectors[0]!.length;
  const rnd = mulberry32(42);
  const basis = [
    Array.from({ length: dims }, () => rnd() * 2 - 1),
    Array.from({ length: dims }, () => rnd() * 2 - 1),
    Array.from({ length: dims }, () => rnd() * 2 - 1),
  ];

  const raw = vectors.map((v) => {
    const p = [0, 0, 0];
    for (let d = 0; d < 3; d++) {
      let s = 0;
      for (let i = 0; i < dims; i++) s += v[i]! * basis[d]![i]!;
      p[d] = s;
    }
    return p;
  });

  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (const p of raw) {
    for (let d = 0; d < 3; d++) {
      mins[d] = Math.min(mins[d]!, p[d]!);
      maxs[d] = Math.max(maxs[d]!, p[d]!);
    }
  }

  return raw.map((p) => ({
    x: normalize(p[0]!, mins[0]!, maxs[0]!),
    y: normalize(p[1]!, mins[1]!, maxs[1]!),
    z: normalize(p[2]!, mins[2]!, maxs[2]!),
  }));
}

function normalize(v: number, min: number, max: number) {
  if (max - min < 1e-9) return 0;
  return ((v - min) / (max - min)) * 2 - 1;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPersonaEmbedText(personaId: string): string {
  const persona = PERSONA_OPTIONS.find((p) => p.id === personaId);
  const feed = PERSONA_TRANSACTIONS[personaId];
  const merchants = (feed?.transactions ?? [])
    .slice(0, 24)
    .map((t) => `${t.category}:${t.merchant}`)
    .join("; ");

  return [
    "USER_PERSONA",
    persona?.summary ?? "custom spend profile",
    persona?.title ?? "",
    "REDACTED_BANK_ACTIVITY",
    merchants,
  ]
    .filter(Boolean)
    .join(" | ");
}

function getRedis() {
  const host = process.env.REDIS_HOST?.trim();
  const port = Number(process.env.REDIS_PORT || 6379);
  const username = process.env.REDIS_USERNAME?.trim();
  const password = process.env.REDIS_PASSWORD?.trim();

  if (!host || !password) {
    throw new Error(
      "Redis is not configured. Set REDIS_HOST and REDIS_PASSWORD in frontend/.env.local.",
    );
  }

  const redis = new Redis({
    host,
    port,
    username: username || undefined,
    password,
    family: 4,
    maxRetriesPerRequest: 2,
    connectTimeout: 12_000,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });

  // Avoid unhandled 'error' events crashing the route while we surface the failure.
  redis.on("error", () => {});

  return redis;
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const elapsed = () => `${Date.now() - t0}ms`;

  let personaId = "urban_diner";
  try {
    const body = (await req.json()) as { personaId?: string };
    if (body.personaId) personaId = body.personaId;
  } catch {
    /* default */
  }

  if (personaId === "custom") personaId = "urban_diner";

  console.log(`[pipeline] START personaId=${personaId}`);

  let redis: Redis | null = null;
  try {
    console.log(`[pipeline] ${elapsed()} connecting to redis...`);
    redis = getRedis();
    await redis.connect();
    console.log(`[pipeline] ${elapsed()} redis connected`);

    const ids = ((await redis.smembers(CARD_IDS_KEY)) as string[]).sort();
    console.log(`[pipeline] ${elapsed()} fetched ${ids.length} card ids from redis`);

    if (!ids.length) {
      return NextResponse.json(
        { error: "No cards in Redis. Load the catalog first." },
        { status: 503 },
      );
    }

    const cards: {
      id: string;
      name: string;
      issuer: string;
      embedding: number[];
      meta: Record<string, unknown> | null;
    }[] = [];

    for (const id of ids) {
      const key = CARD_KEY(id);
      const [name, issuer, embeddingBuf, metaRaw] = await Promise.all([
        redis.hget(key, "name"),
        redis.hget(key, "issuer"),
        redis.hgetBuffer(key, "embedding"),
        redis.hget(key, "metadata_json"),
      ]);

      if (!embeddingBuf || embeddingBuf.length < 32) continue;
      const floats = floatsFromBuffer(embeddingBuf);
      let meta: Record<string, unknown> | null = null;
      try {
        meta = metaRaw ? (JSON.parse(metaRaw) as Record<string, unknown>) : null;
      } catch {
        meta = null;
      }

      cards.push({
        id,
        name: name || id,
        issuer: issuer || "",
        embedding: floats,
        meta,
      });
    }

    console.log(`[pipeline] ${elapsed()} loaded ${cards.length}/${ids.length} cards with embeddings+meta from redis`);

    if (!cards.length) {
      return NextResponse.json(
        { error: "Could not decode card embeddings from Redis." },
        { status: 503 },
      );
    }

    console.log(`[pipeline] ${elapsed()} calling OpenAI embeddings...`);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embedText = buildPersonaEmbedText(personaId);
    const embedRes = await openai.embeddings.create({
      model: MODEL,
      input: embedText,
    });
    const query = embedRes.data[0]!.embedding;
    console.log(`[pipeline] ${elapsed()} got embedding, dims=${query.length}`);

    const scored = cards
      .map((card) => {
        const score = cosine(query, card.embedding);
        const angleDeg = (Math.acos(Math.min(1, Math.max(-1, score))) * 180) / Math.PI;
        const officialUrl =
          typeof card.meta?.official_url === "string"
            ? (card.meta.official_url as string)
            : null;
        return {
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          score,
          angleDeg,
          officialUrl,
          blurb: summarizeCard(card.meta, card.name, card.issuer),
        };
      })
      .sort((a, b) => b.score - a.score);

    console.log(`[pipeline] ${elapsed()} scored+sorted ${scored.length} cards, top1=${scored[0]?.id}`);

    const topK = scored.slice(0, 10);
    const topIds = new Set(topK.map((t) => t.id));
    const blurbById = new Map(scored.map((s) => [s.id, s.blurb]));
    const angleById = new Map(scored.map((s) => [s.id, s.angleDeg]));

    // Real projected-value ranking: kNN above is recall only (a semantically
    // plausible candidate set); dollar delta vs. the user's current card is
    // the actual tiebreaker, per rewards/calculator.py + rewards/ranking.py.
    let recommendations: ReturnType<typeof rankCandidates> = [];
    let currentCardValue: ReturnType<typeof calculateCardValue> | null = null;
    let currentCardId: string | undefined;
    let currentCardName: string | null = null;
    let currentCardIssuer: string | null = null;
    let categoryTotals: ReturnType<typeof aggregateAnnualTotals> = {};

    try {
      const persona = PERSONA_OPTIONS.find((p) => p.id === personaId);
      currentCardId = persona?.currentCardId;
      const audience = persona?.audience ?? "consumer";
      console.log(
        `[pipeline] ${elapsed()} [ranking] persona=${persona?.id} currentCardId=${currentCardId} audience=${audience}`,
      );

      categoryTotals = aggregateAnnualTotals(
        PERSONA_TRANSACTIONS[personaId]?.transactions ?? [],
      );
      console.log(`[pipeline] ${elapsed()} [ranking] categoryTotals=`, categoryTotals);

      const cardsById = new Map(cards.map((c) => [c.id, c]));
      const currentCardRecord = currentCardId ? cardsById.get(currentCardId) : undefined;
      const currentCardMeta = currentCardRecord?.meta as CardMetadata | undefined;
      currentCardName = currentCardRecord?.name ?? null;
      currentCardIssuer = currentCardRecord?.issuer ?? null;
      console.log(
        `[pipeline] ${elapsed()} [ranking] currentCardMeta found=${Boolean(currentCardMeta)} name=${currentCardName}`,
      );

      if (currentCardMeta) {
        currentCardValue = calculateCardValue(currentCardMeta, categoryTotals);
        console.log(
          `[pipeline] ${elapsed()} [ranking] currentCardValue net=${currentCardValue.net_annual_value_usd}`,
        );

        // Rank only within the kNN top-10 (topK): kNN does recall (the
        // semantically plausible candidate set), dollar delta is the
        // tiebreaker *within* that set -- not a search over the full catalog.
        const rankPool: RankCandidate[] = topK.flatMap((s) => {
          const meta = cardsById.get(s.id)?.meta as CardMetadata | undefined;
          return meta ? [{ id: s.id, name: s.name, issuer: s.issuer, metadata: meta }] : [];
        });
        console.log(`[pipeline] ${elapsed()} [ranking] rankPool size=${rankPool.length}`);

        recommendations = rankCandidates(
          rankPool,
          audience,
          currentCardId!,
          currentCardMeta,
          categoryTotals,
        );
        console.log(
          `[pipeline] ${elapsed()} [ranking] recommendations=${recommendations.length}`,
          recommendations.map((r) => `${r.card_id}:${r.delta_usd}`),
        );
      } else {
        console.warn(
          `[pipeline] ${elapsed()} [ranking] SKIPPED - no currentCardMeta for currentCardId=${currentCardId}`,
        );
      }
    } catch (rankErr) {
      console.error(`[pipeline] ${elapsed()} [ranking] THREW:`, rankErr);
      throw rankErr;
    }

    const projected = projectTo3D([
      ...cards.map((c) => c.embedding),
      query,
    ]);

    const points = cards.map((card, i) => ({
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      x: projected[i]!.x,
      y: projected[i]!.y,
      z: projected[i]!.z,
      isTop: topIds.has(card.id),
      score: scored.find((s) => s.id === card.id)?.score ?? 0,
      angleDeg: angleById.get(card.id) ?? 0,
      blurb: blurbById.get(card.id) ?? null,
    }));

    const userPoint = {
      x: projected[projected.length - 1]!.x,
      y: projected[projected.length - 1]!.y,
      z: projected[projected.length - 1]!.z,
    };

    const fingerprint = createHash("sha256")
      .update(embedText)
      .digest("hex")
      .slice(0, 12);

    console.log(`[pipeline] ${elapsed()} DONE, returning response`);

    return NextResponse.json({
      model: MODEL,
      personaId,
      cardCount: cards.length,
      fingerprint,
      redacted: true,
      embedPreview: query.slice(0, 12).map((n) => Number(n.toFixed(4))),
      userPoint,
      points,
      topK,
      currentCardId: currentCardId ?? null,
      currentCardName,
      currentCardIssuer,
      currentCardValue,
      recommendations,
      categoryTotals,
    });
  } catch (err) {
    console.error(`[pipeline] ${elapsed()} FAILED:`, err);
    if (err instanceof Error && err.stack) {
      console.error(`[pipeline] stack:`, err.stack);
    }
    const message = err instanceof Error ? err.message : "Pipeline failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (redis) {
      console.log(`[pipeline] ${elapsed()} disconnecting redis`);
      redis.disconnect();
    }
  }
}

function summarizeCard(
  meta: Record<string, unknown> | null,
  name: string,
  issuer: string,
) {
  if (!meta) {
    return {
      name,
      issuer,
      annualFee: null as number | null,
      earnHighlight: [] as string[],
      benefits: [] as string[],
      summary: `${issuer} card — details unavailable.`,
    };
  }

  const annualFee =
    typeof meta.annual_fee_usd === "number" ? meta.annual_fee_usd : null;
  const earnRates = Array.isArray(meta.earn_rates)
    ? (meta.earn_rates as { category?: string; rate?: number; unit?: string }[])
    : [];
  const earnHighlight = [...earnRates]
    .filter((e) => typeof e.rate === "number")
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))
    .slice(0, 3)
    .map((e) => {
      const unit = (e.unit || "").includes("percent") ? "%" : "x";
      const cat = (e.category || "purchases").replace(/\s+/g, " ").slice(0, 42);
      return `${e.rate}${unit} ${cat}`;
    });

  const benefitsRaw = Array.isArray(meta.credits_and_benefits)
    ? (meta.credits_and_benefits as { name?: string }[])
    : [];
  const benefits = benefitsRaw
    .map((b) => (b.name || "").replace(/\\/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const rec = meta.recommendation as { summary?: string } | undefined;
  const summary =
    rec?.summary ||
    (typeof meta.rewards_program === "string"
      ? `${issuer} · ${meta.rewards_program}`
      : `${issuer} card`);

  return {
    name,
    issuer,
    annualFee,
    earnHighlight,
    benefits,
    summary: String(summary).slice(0, 180),
  };
}
