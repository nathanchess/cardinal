"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { resolveCardArt } from "@/data/card-art";
import { formatMoney, PERSONA_TRANSACTIONS } from "@/data/transactions";
import type { PipelineHit } from "@/data/mock-savings";

const ease = [0.22, 1, 0.36, 1] as const;

type RerankScreenProps = {
  personaId: string;
  hits: PipelineHit[];
  onComplete: () => void;
};

export function RerankScreen({ personaId, hits, onComplete }: RerankScreenProps) {
  const [progress, setProgress] = useState(0);
  const txns = useMemo(() => {
    const feed = PERSONA_TRANSACTIONS[personaId]?.transactions ?? [];
    return [...feed].slice(-8).reverse();
  }, [personaId]);

  const cards = hits.slice(0, 6);

  useEffect(() => {
    const start = performance.now();
    const duration = 5200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out progress
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else onComplete();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const formulas = [
    "s′ = α·cos(θ) + β·E[rewards] − γ·fee",
    "E[rewards] = Σ c∈C  rate_c · spend_c",
    "rank = softmax(s′₁…s′ₖ)",
  ];

  return (
    <motion.section
      className="relative z-10 mx-auto flex h-[100svh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-10 text-center"
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(10px)", y: -12 }}
      transition={{ duration: 0.55, ease }}
    >
      <h2 className="mb-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[28px]">
        Personalizing rankings
      </h2>
      <p className="mb-8 max-w-lg text-[14px] leading-relaxed text-[var(--muted)] sm:text-[15px]">
        Re-ranking KNN results to personalize card recommendations
      </p>

      <div className="relative mb-8 w-full max-w-xl overflow-hidden rounded-[12px] border border-[var(--border)] bg-[#FAFAF8] px-4 py-6 sm:px-6">
        {/* Fake formula board */}
        <div className="mb-6 space-y-2 font-mono text-[12px] text-[var(--ink)] sm:text-[13px]">
          {formulas.map((f, i) => (
            <motion.p
              key={f}
              className="rounded-[8px] border border-[var(--border)] bg-white px-3 py-2 text-left"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.2, duration: 0.45, ease }}
            >
              {f}
            </motion.p>
          ))}
        </div>

        {/* Feeding chips */}
        <div className="relative mb-5 h-[120px]">
          {txns.map((txn, i) => (
            <motion.span
              key={`t-${txn.merchant}-${i}`}
              className="absolute left-1/2 top-1/2 max-w-[130px] truncate rounded-[8px] border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-medium text-[var(--ink)] shadow-sm"
              initial={{ x: -140 - i * 8, y: -40 + (i % 4) * 18, opacity: 0 }}
              animate={{
                x: [-140, -40, 0],
                y: [-40 + (i % 4) * 18, 0, 0],
                opacity: [0, 1, 0],
                scale: [0.95, 1, 0.7],
              }}
              transition={{
                duration: 2.2,
                delay: i * 0.22,
                repeat: Infinity,
                repeatDelay: 1.4,
                ease,
              }}
              style={{ translateX: "-50%", translateY: "-50%" }}
            >
              {txn.merchant}
            </motion.span>
          ))}
          {cards.map((card, i) => {
            const art = resolveCardArt(card.id);
            return (
              <motion.span
                key={`c-${card.id}`}
                className="absolute left-1/2 top-1/2 flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-white px-1.5 py-1 shadow-sm"
                initial={{ x: 140 + i * 10, y: -30 + (i % 3) * 22, opacity: 0 }}
                animate={{
                  x: [140, 40, 0],
                  y: [-30 + (i % 3) * 22, 0, 0],
                  opacity: [0, 1, 0],
                  scale: [0.95, 1, 0.7],
                }}
                transition={{
                  duration: 2.2,
                  delay: 0.35 + i * 0.25,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease,
                }}
                style={{ translateX: "-50%", translateY: "-50%" }}
              >
                <span className="relative h-5 w-8 overflow-hidden rounded-[3px] bg-[var(--ink)]">
                  {art ? (
                    <Image src={art} alt="" fill unoptimized className="object-cover" />
                  ) : null}
                </span>
                <span className="max-w-[90px] truncate text-[9px] font-medium text-[var(--ink)]">
                  {card.name}
                </span>
              </motion.span>
            );
          })}
          <div className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white shadow-[0_10px_28px_rgba(17,17,17,0.1)]">
            <Image
              src="/brand/cardinal-bird-white.svg"
              alt=""
              width={28}
              height={28}
              unoptimized
              className="invert"
            />
          </div>
        </div>

        <div className="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#EBEBE7]">
          <motion.div
            className="h-full rounded-full bg-[var(--ink)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] tabular-nums text-[var(--muted)]">
          {progress}%
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={progress < 40 ? "a" : progress < 75 ? "b" : "c"}
          className="text-[13px] text-[var(--muted)]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {progress < 40
            ? "Ingesting redacted bank activity…"
            : progress < 75
              ? "Scoring similar cards against your spend mix…"
              : "Locking personalized order…"}
        </motion.p>
      </AnimatePresence>
    </motion.section>
  );
}
