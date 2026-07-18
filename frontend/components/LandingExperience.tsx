"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CARD_FLY_DURATION_MS,
  FloatingCards,
} from "@/components/FloatingCards";
import { ArchitecturePipeline } from "@/components/ArchitecturePipeline";
import { ConnectBankScreen } from "@/components/ConnectBankScreen";
import { PersonaPicker } from "@/components/PersonaPicker";
import { RerankScreen } from "@/components/RerankScreen";
import { ResultsExperience } from "@/components/ResultsExperience";
import type { PipelinePayload } from "@/data/mock-savings";

type Stage =
  | "intro"
  | "cards"
  | "brand"
  | "personas"
  | "connecting"
  | "architecture"
  | "rerank"
  | "results";

const PAUSE_AFTER_CARDS_MS = 500;
const BRAND_MOVE_MS = 1400;

const CORNER = { left: 20, top: 20 } as const;
const LARGE = { w: 180, h: 180, font: 64, gap: 22 } as const;
const SMALL = { w: 44, h: 44, font: 22, gap: 10 } as const;

const brandEase = [0.22, 1, 0.36, 1] as const;
const glideEase = [
  [0.33, 1, 0.68, 1],
  [0.16, 1, 0.3, 1],
] as const;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function LandingExperience() {
  const reduceMotion = useReducedMotion();
  const slotRef = useRef<HTMLDivElement>(null);
  const frozenOrigin = useRef<{ left: number; top: number } | null>(null);

  const [stage, setStage] = useState<Stage>("intro");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState({ left: 0, top: 0 });
  const [ready, setReady] = useState(false);
  const [pipeline, setPipeline] = useState<PipelinePayload | null>(null);

  const brandAtCorner =
    stage === "brand" ||
    stage === "personas" ||
    stage === "connecting" ||
    stage === "architecture" ||
    stage === "rerank";
  const hideBrand = stage === "results";
  const flyAway = stage !== "intro";
  const showHero = stage === "intro" || stage === "cards";
  const lockScroll =
    stage === "connecting" ||
    stage === "architecture" ||
    stage === "personas" ||
    stage === "rerank";

  const startConnect = useCallback(() => {
    setStage("connecting");
  }, []);

  const finishConnect = useCallback(() => {
    setStage("architecture");
  }, []);

  const startRerank = useCallback((payload: PipelinePayload) => {
    setPipeline(payload);
    setStage("rerank");
  }, []);

  const finishRerank = useCallback(() => {
    setStage("results");
  }, []);

  useEffect(() => {
    if (lockScroll) {
      const prevBody = document.body.style.overflow;
      const prevHtml = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevBody;
        document.documentElement.style.overflow = prevHtml;
      };
    }
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    return;
  }, [lockScroll]);

  useLayoutEffect(() => {
    // Once the flow starts, keep the brand parked on its frozen intro rect
    if (frozenOrigin.current) {
      setOrigin(frozenOrigin.current);
      setReady(true);
      return;
    }

    const measure = () => {
      const el = slotRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setOrigin({ left: rect.left, top: rect.top });
      setReady(true);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stage]);

  const startFlow = useCallback(async () => {
    if (busy || stage !== "intro") return;
    setBusy(true);

    const el = slotRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const pos = { left: rect.left, top: rect.top };
      frozenOrigin.current = pos;
      setOrigin(pos);
    }

    setStage("cards");
    await wait(CARD_FLY_DURATION_MS + 150);
    await wait(PAUSE_AFTER_CARDS_MS);

    setStage("brand");
    await wait(reduceMotion ? 200 : BRAND_MOVE_MS);

    setStage("personas");
    setBusy(false);
  }, [busy, stage, reduceMotion]);

  const from = frozenOrigin.current ?? origin;

  return (
    <>
      <FloatingCards flyAway={flyAway} />

      <motion.header
        className="pointer-events-none fixed z-30 flex items-center"
        style={{ opacity: ready && !hideBrand ? 1 : 0 }}
        initial={false}
        animate={
          brandAtCorner
            ? reduceMotion
              ? {
                  left: CORNER.left,
                  top: CORNER.top,
                  gap: SMALL.gap,
                }
              : {
                  left: [from.left, from.left + 64, CORNER.left],
                  top: [from.top, from.top + 52, CORNER.top],
                  gap: [LARGE.gap, LARGE.gap - 2, SMALL.gap],
                }
            : {
                left: origin.left,
                top: origin.top,
                gap: LARGE.gap,
              }
        }
        transition={
          brandAtCorner && !reduceMotion
            ? {
                duration: BRAND_MOVE_MS / 1000,
                times: [0, 0.22, 1],
                ease: [...glideEase],
              }
            : { duration: 0 }
        }
      >
        <motion.div
          className="relative shrink-0"
          initial={false}
          animate={
            brandAtCorner
              ? reduceMotion
                ? { width: SMALL.w, height: SMALL.h }
                : {
                    width: [LARGE.w, LARGE.w * 0.97, SMALL.w],
                    height: [LARGE.h, LARGE.h * 0.97, SMALL.h],
                  }
              : { width: LARGE.w, height: LARGE.h }
          }
          transition={
            brandAtCorner && !reduceMotion
              ? {
                  duration: BRAND_MOVE_MS / 1000,
                  times: [0, 0.22, 1],
                  ease: [...glideEase],
                }
              : { duration: 0 }
          }
        >
          <Image
            src="/brand/cardinal-logo.jpg"
            alt="Cardinal"
            fill
            priority
            unoptimized
            sizes="200px"
            className="object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.1)]"
          />
        </motion.div>
        <motion.h1
          className="font-wordmark font-medium leading-[0.9] tracking-[-0.06em] text-[var(--ink)] whitespace-nowrap"
          initial={false}
          animate={
            brandAtCorner
              ? reduceMotion
                ? { fontSize: SMALL.font }
                : {
                    fontSize: [LARGE.font, LARGE.font - 2, SMALL.font],
                  }
              : { fontSize: LARGE.font }
          }
          transition={
            brandAtCorner && !reduceMotion
              ? {
                  duration: BRAND_MOVE_MS / 1000,
                  times: [0, 0.22, 1],
                  ease: [...glideEase],
                }
              : { duration: 0 }
          }
        >
          Cardinal
        </motion.h1>
      </motion.header>

      <AnimatePresence>
        {showHero ? (
          <section
            key="intro"
            className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-6 pb-24 pt-20 text-center"
          >
            {/* Slot matches original logo+wordmark footprint above the CTA */}
            <div
              ref={slotRef}
              className="mb-8 h-[180px] w-[min(480px,92vw)]"
              aria-hidden="true"
            />

            {/* Keep CTA height during cards so the slot doesn’t jump */}
            <div className="flex h-[52px] items-center justify-center">
              <AnimatePresence mode="popLayout">
                {stage === "intro" ? (
                  <motion.div
                    key="cta"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: brandEase }}
                  >
                    <motion.button
                      type="button"
                      onClick={startFlow}
                      disabled={busy}
                      className="pointer-events-auto inline-flex h-[52px] items-center gap-2.5 rounded-[10px] border border-[var(--ink)] bg-[var(--ink)] px-[22px] text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(17,17,17,0.08)] disabled:opacity-70"
                      whileHover={{
                        y: -2,
                        boxShadow: "0 4px 12px rgba(17,17,17,0.12)",
                      }}
                      whileTap={{ y: 1, scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                      }}
                    >
                      Find your perfect credit card
                      <ArrowRight
                        className="h-[17px] w-[17px]"
                        strokeWidth={1.75}
                      />
                    </motion.button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "personas" ? (
          <PersonaPicker
            key="personas"
            selectedId={selectedId}
            onSelect={setSelectedId}
            onConnect={startConnect}
          />
        ) : null}
        {stage === "connecting" ? (
          <ConnectBankScreen key="connecting" onComplete={finishConnect} />
        ) : null}
        {stage === "architecture" ? (
          <ArchitecturePipeline
            key="architecture"
            personaId={selectedId ?? "urban_diner"}
            onRankCards={startRerank}
          />
        ) : null}
        {stage === "rerank" && pipeline ? (
          <RerankScreen
            key="rerank"
            personaId={selectedId ?? "urban_diner"}
            hits={pipeline.topK}
            onComplete={finishRerank}
          />
        ) : null}
        {stage === "results" && pipeline ? (
          <ResultsExperience key="results" pipeline={pipeline} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
