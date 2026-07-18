"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EmbeddingCloud,
  type VizPoint,
} from "@/components/EmbeddingCloud";
import type { PipelineHit, PipelinePayload } from "@/data/mock-savings";
import { buildEmbedFlingChips } from "@/data/personas";
import {
  getCategoryStyle,
  PERSONA_TRANSACTIONS,
} from "@/data/transactions";

const ease = [0.22, 1, 0.36, 1] as const;

const CHIP_KIND_STYLE: Record<
  "merchant" | "intensity" | "meta",
  string
> = {
  merchant: "border-[var(--border)] bg-white text-[var(--ink)]",
  intensity: "border-[#D6E8F8] bg-[#F3F8FC] text-[#1B6BC4]",
  meta: "border-[var(--border)] bg-[#F4F4F1] text-[var(--muted)]",
};

type Phase = "openai" | "redis" | "user" | "knn" | "ready" | "error";

type ArchitecturePipelineProps = {
  personaId: string;
  onRankCards: (payload: PipelinePayload) => void;
};

export function ArchitecturePipeline({
  personaId,
  onRankCards,
}: ArchitecturePipelineProps) {
  const [phase, setPhase] = useState<Phase>("openai");
  const [data, setData] = useState<PipelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [embedNums, setEmbedNums] = useState<number[]>([]);
  const [embedStatus, setEmbedStatus] = useState<"calling" | "ready">("calling");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const flingChips = useMemo(() => {
    const feed = PERSONA_TRANSACTIONS[personaId]?.transactions ?? [];
    const merchants = [...feed]
      .slice(-16)
      .reverse()
      .map((txn) => txn.merchant);
    return buildEmbedFlingChips(personaId, merchants);
  }, [personaId]);

  const runSimilaritySearch = useCallback(async () => {
    if (!data || cancelledRef.current) return;
    setPhase("redis");
    await wait(2000);
    if (cancelledRef.current) return;
    setPhase("user");
    await wait(1400);
    if (cancelledRef.current) return;
    setPhase("knn");
    await wait(2200);
    if (cancelledRef.current) return;
    setPhase("ready");
  }, [data]);

  useEffect(() => {
    cancelledRef.current = false;
    const numTimer = window.setInterval(() => {
      setEmbedNums((prev) => {
        const next = [...prev];
        next.push(Number((Math.random() * 2 - 1).toFixed(3)));
        return next.slice(-12);
      });
    }, 140);

    const run = async () => {
      setPhase("openai");
      setEmbedStatus("calling");
      setData(null);
      setError(null);
      const minSpin = wait(2800);
      const fetchPromise = fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId }),
      }).then(async (res) => {
        const json = (await res.json()) as PipelinePayload & { error?: string };
        if (!res.ok) throw new Error(json.error || "Pipeline failed");
        return json;
      });

      try {
        const [json] = await Promise.all([fetchPromise, minSpin]);
        if (cancelledRef.current) return;
        window.clearInterval(numTimer);
        if (json.embedPreview?.length) {
          setEmbedNums(json.embedPreview.map((n) => Number(n.toFixed(3))));
        }
        setEmbedStatus("ready");
        setData(json);
      } catch (e) {
        if (cancelledRef.current) return;
        window.clearInterval(numTimer);
        setError(e instanceof Error ? e.message : "Something went wrong");
        setPhase("error");
      }
    };

    void run();
    return () => {
      cancelledRef.current = true;
      window.clearInterval(numTimer);
    };
  }, [personaId]);

  return (
    <motion.section
      className="relative z-10 mx-auto flex h-[100svh] w-full max-w-4xl flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-8 text-center"
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.65, ease }}
    >
      <AnimatePresence mode="wait">
        {phase === "openai" ? (
          <motion.div
            key="openai"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="mb-2 text-[26px] font-semibold tracking-[-0.03em] text-[var(--ink)]">
              Creating your spend embedding
            </h2>
            <p className="mb-3 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
              Merchants and spend signals (low / medium / high) plus your goals
              and fee comfort feed OpenAI. Exact dollar amounts stay out of the
              vector. PII redacted; we never save your raw bank data.
            </p>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink)]">
              {embedStatus === "calling" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted)]" />
                  Calling text-embedding-3-small…
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[#1B6BC4]" />
                  Embedding ready
                </>
              )}
            </div>

            <div className="relative mb-6 h-[280px] w-full max-w-xl overflow-hidden rounded-[12px] border border-[var(--border)] bg-[#FAFAF8]">
              <div className="absolute left-1/2 top-[42%] z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-[0_12px_32px_rgba(17,17,17,0.1)]">
                <div className="relative h-10 w-10">
                  <Image
                    src="/brand/openai.png"
                    alt="OpenAI"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>

              <AnimatePresence>
                {embedStatus === "calling"
                  ? flingChips.map((chip, i) => {
                      const side = i % 2 === 0 ? -1 : 1;
                      const startX = side * (150 + (i % 5) * 30);
                      const startY = -95 + (i % 7) * 26;
                      const categoryHint = chip.category
                        ? getCategoryStyle(chip.category).color
                        : undefined;
                      return (
                        <motion.div
                          key={chip.id}
                          className={`absolute left-1/2 top-[42%] z-[5] max-w-[160px] -translate-x-1/2 -translate-y-1/2 truncate rounded-[8px] border px-2 py-1 text-[10px] font-medium shadow-sm ${CHIP_KIND_STYLE[chip.kind]}`}
                          style={
                            categoryHint
                              ? {
                                  borderColor: `${categoryHint}55`,
                                  color: categoryHint,
                                  backgroundColor: `${categoryHint}12`,
                                }
                              : undefined
                          }
                          initial={{
                            x: startX,
                            y: startY,
                            opacity: 0,
                            scale: 0.9,
                          }}
                          animate={{
                            x: [startX, startX * 0.55, 0],
                            y: [startY, startY * 0.35, 0],
                            opacity: [0, 1, 1, 0],
                            scale: [0.9, 1, 0.55],
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.35, ease },
                          }}
                          transition={{
                            duration: 1.65,
                            delay: i * 0.14,
                            ease: ease,
                            times: [0, 0.35, 0.85, 1],
                            repeat: Infinity,
                            repeatDelay: 1.2,
                          }}
                        >
                          {chip.label}
                        </motion.div>
                      );
                    })
                  : null}
              </AnimatePresence>

              <div className="absolute inset-x-3 bottom-3 z-[6] h-[56px] overflow-hidden rounded-[8px] border border-[var(--border)] bg-white/95 px-2 py-1.5">
                <p className="mb-1 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  embedding · text-embedding-3-small
                </p>
                <div className="flex h-[28px] flex-nowrap items-center gap-1 overflow-hidden font-mono text-[10px] tabular-nums text-[var(--ink)]">
                  {embedNums.length === 0 ? (
                    <span className="text-[var(--muted)]">awaiting tokens…</span>
                  ) : (
                    embedNums.map((n, i) => (
                      <motion.span
                        key={`${i}-${n}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="shrink-0 rounded-[3px] bg-[#F4F4F1] px-1"
                      >
                        {n.toFixed(3)}
                      </motion.span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {embedStatus === "ready" && data ? (
              <motion.button
                type="button"
                onClick={() => void runSimilaritySearch()}
                className="group relative inline-flex h-[52px] items-center gap-2.5 overflow-hidden rounded-[10px] border border-[var(--ink)] bg-[var(--ink)] px-[22px] text-[15px] font-semibold text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -2,
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(17,17,17,0.35), 0 0 48px rgba(35,131,226,0.28)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.18),transparent_55%)]" />
                </span>
                <Search className="relative h-4 w-4" strokeWidth={1.75} />
                <span className="relative">Find similar cards</span>
              </motion.button>
            ) : null}
          </motion.div>
        ) : null}

        {phase === "redis" ||
        phase === "user" ||
        phase === "knn" ||
        phase === "ready" ? (
          <motion.div
            key="redis-viz"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/brand/redis.svg"
                  alt="Redis"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                  Redis Vector Index
                </p>
                <p className="max-w-xl text-[12px] leading-snug text-[var(--muted)]">
                  Cosine similarity over card embeddings finds nearby matches
                  for your spend profile.
                </p>
              </div>
            </div>

            <div className="mb-3 w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-[#FAFAF8]">
              {data ? (
                <EmbeddingCloud
                  points={data.points as VizPoint[]}
                  userPoint={data.userPoint}
                  showUser={
                    phase === "user" || phase === "knn" || phase === "ready"
                  }
                  highlightTop={phase === "knn" || phase === "ready"}
                  showAngles={phase === "knn" || phase === "ready"}
                  selectedId={selectedCardId}
                  onSelectedIdChange={setSelectedCardId}
                  className="h-[min(48vh,400px)] w-full"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center text-[var(--muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {phase === "redis" ? (
                <motion.p
                  key="redis-copy"
                  className="max-w-md text-[14px] text-[var(--muted)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Plotting the live Redis card embedding space…
                </motion.p>
              ) : null}
              {phase === "user" ? (
                <motion.p
                  key="user-copy"
                  className="max-w-md text-[14px] text-[var(--muted)]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  Your redacted spend vector lands in the space (black).
                </motion.p>
              ) : null}
              {phase === "knn" || phase === "ready" ? (
                <motion.div
                  key="knn-copy"
                  className="w-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="mb-1 text-[14px] font-semibold text-[var(--ink)]">
                    Similar cards
                  </p>
                  <p className="mb-3 text-[13px] text-[var(--muted)]">
                    Ranked by cosine similarity only. Hover or click to
                    inspect. θ is the angle between vectors.
                  </p>
                  {data ? (
                    <ul className="mx-auto mb-4 grid max-h-[22vh] max-w-2xl grid-cols-1 gap-1.5 overflow-y-auto text-left sm:grid-cols-2">
                      {data.topK.map((hit: PipelineHit, i: number) => {
                        const active = selectedCardId === hit.id;
                        return (
                          <li key={hit.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCardId(active ? null : hit.id)
                              }
                              className={`flex w-full items-center justify-between gap-2 rounded-[8px] border px-2.5 py-1.5 text-left text-[12px] transition ${
                                active
                                  ? "border-[var(--ink)] bg-[#F4F4F1] text-[var(--ink)]"
                                  : "border-[var(--border)] bg-white text-[var(--ink)] hover:border-[var(--ink)]/40"
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                <span className="mr-1.5 tabular-nums text-[var(--muted)]">
                                  {i + 1}.
                                </span>
                                {hit.name}
                              </span>
                              <span className="shrink-0 tabular-nums text-[#1B6BC4]">
                                {hit.score.toFixed(3)}
                                {typeof hit.angleDeg === "number" ? (
                                  <span className="ml-1.5 text-[var(--muted)]">
                                    θ{hit.angleDeg.toFixed(0)}°
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {phase === "ready" && data ? (
              <motion.button
                type="button"
                onClick={() => onRankCards(data)}
                className="group relative mt-1 inline-flex h-[52px] items-center gap-2.5 overflow-hidden rounded-[10px] border border-[var(--ink)] bg-[var(--ink)] px-[22px] text-[15px] font-semibold text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -2,
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(17,17,17,0.35), 0 0 48px rgba(35,131,226,0.28)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.18),transparent_55%)]" />
                </span>
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Image
                    src="/brand/cardinal-bird-white.svg"
                    alt=""
                    width={22}
                    height={22}
                    unoptimized
                    className="object-contain"
                  />
                </span>
                <span className="relative">Rank cards</span>
              </motion.button>
            ) : null}
          </motion.div>
        ) : null}

        {phase === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md text-[15px] text-[var(--muted)]"
          >
            Couldn’t reach Redis / OpenAI: {error}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}
