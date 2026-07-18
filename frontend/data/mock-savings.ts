import type { CardBlurb } from "@/components/EmbeddingCloud";
import { PERSONA_TRANSACTIONS } from "@/data/transactions";

export type PipelineHit = {
  id: string;
  name: string;
  issuer: string;
  score: number;
  angleDeg?: number;
  officialUrl?: string | null;
  blurb?: CardBlurb | null;
};

export type PipelinePayload = {
  cardCount: number;
  fingerprint: string;
  model?: string;
  embedPreview?: number[];
  userPoint: { x: number; y: number; z: number };
  points: unknown[];
  topK: PipelineHit[];
};

export type MockSavingsReport = {
  rankScore: number;
  annualSavings: number;
  /** Cents-per-point used to translate reward points → dollars */
  cpp: number;
  monthly: { label: string; amount: number; points: number }[];
  breakdown: { label: string; amount: number; detail: string }[];
  methodNotes: string[];
  disclaimer: string;
};

/** Deterministic mock re-rank / savings math for the results UI. */
export function buildMockSavingsReport(
  personaId: string,
  hit: PipelineHit,
  rankIndex: number,
): MockSavingsReport {
  const feed = PERSONA_TRANSACTIONS[personaId]?.transactions ?? [];
  const spendByCat = new Map<string, number>();
  for (const t of feed) {
    spendByCat.set(t.category, (spendByCat.get(t.category) ?? 0) + t.amount);
  }

  const cosineBoost = Math.max(0, hit.score);
  const fee =
    typeof hit.blurb?.annualFee === "number" ? hit.blurb.annualFee : 95;
  const baseRate = 0.015 + cosineBoost * 0.025;
  const dining = (spendByCat.get("dining") ?? 0) * (0.03 + cosineBoost * 0.02);
  const grocery =
    (spendByCat.get("groceries") ?? 0) * (0.025 + cosineBoost * 0.015);
  const travel =
    (spendByCat.get("travel") ?? spendByCat.get("flights") ?? 0) *
    (0.02 + cosineBoost * 0.03);
  const other = Math.max(
    0,
    feed.reduce((s, t) => s + t.amount, 0) -
      (spendByCat.get("dining") ?? 0) -
      (spendByCat.get("groceries") ?? 0) -
      (spendByCat.get("travel") ?? 0) -
      (spendByCat.get("flights") ?? 0),
  );
  const otherRewards = other * baseRate;
  const creditsMock = Math.min(300, 40 + rankIndex * 18 + fee * 0.35);
  const gross = dining + grocery + travel + otherRewards + creditsMock;
  const annualSavings = Math.max(40, Math.round(gross - fee));

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const cpp = 1.2 + cosineBoost * 0.6; // cents per point → dollars = points * cpp / 100
  const monthly = months.map((label, i) => {
    const season = 0.85 + 0.3 * Math.sin((i / 12) * Math.PI * 2 + rankIndex);
    const amount = Math.round((annualSavings / 12) * season);
    const points = Math.round((amount * 100) / cpp);
    return { label, amount, points };
  });

  const rankScore = Math.round(
    Math.min(99, Math.max(55, cosineBoost * 72 + (10 - rankIndex) * 2.4 + 18)),
  );

  return {
    rankScore,
    annualSavings,
    cpp: Number(cpp.toFixed(2)),
    monthly,
    breakdown: [
      {
        label: "Dining rewards",
        amount: Math.round(dining),
        detail: `Applied elevated earn on dining spend using cosine fit ${(cosineBoost * 100).toFixed(1)}%.`,
      },
      {
        label: "Grocery rewards",
        amount: Math.round(grocery),
        detail: "Category multiplier from card earn schedule (mocked).",
      },
      {
        label: "Travel / flights",
        amount: Math.round(travel),
        detail: "Transfer / portal value estimate on travel-like spend.",
      },
      {
        label: "Everywhere else",
        amount: Math.round(otherRewards),
        detail: `Baseline ${((baseRate) * 100).toFixed(1)}% effective back on residual spend.`,
      },
      {
        label: "Credits & benefits",
        amount: Math.round(creditsMock),
        detail: "Statement credits / lounge / dining credits assumed utilized.",
      },
      {
        label: "Annual fee",
        amount: -Math.round(fee),
        detail: "Subtracted from gross rewards to estimate net savings.",
      },
    ],
    methodNotes: [
      `Start from bank activity for persona (${feed.length} sample transactions).`,
      `Seed with KNN cosine similarity ${hit.score.toFixed(3)} (θ ${(hit.angleDeg ?? 0).toFixed(0)}°).`,
      "Map spend categories → card earn rates (illustrative multipliers).",
      `Convert earned points to dollars at ~${cpp.toFixed(2)}¢ per point.`,
      "Add expected credit utilization, subtract annual fee.",
      "Project month-by-month with light seasonality for the chart.",
    ],
    disclaimer:
      "Illustrative estimate only — not a guarantee. Confirm terms with the issuer before applying.",
  };
}
