"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import { BankStatementFeed } from "@/components/BankStatementFeed";
import { PersonaCharacter } from "@/components/PersonaCharacters";
import {
  creditScoreLabel,
  PERSONA_OPTIONS,
  type PersonaOption,
} from "@/data/personas";

type PersonaPickerProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConnect: () => void;
};

export function PersonaPicker({
  selectedId,
  onSelect,
  onConnect,
}: PersonaPickerProps) {
  const selected = PERSONA_OPTIONS.find((p) => p.id === selectedId) ?? null;

  return (
    <motion.section
      className="relative z-10 mx-auto flex h-[100svh] w-full max-w-2xl flex-col items-center overflow-hidden px-6 pb-4 pt-20 text-center sm:pt-24"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24, filter: "blur(6px)", scale: 0.98 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mb-5 max-w-md shrink-0 text-[14px] leading-relaxed text-[var(--muted)] sm:text-[15px]">
        Pick a persona that feels like you—or build a custom profile.
      </p>

      <ul className="mb-4 flex w-full max-w-2xl shrink-0 flex-nowrap items-start justify-center gap-3 sm:gap-6">
        {PERSONA_OPTIONS.map((persona, index) => (
          <PersonaIcon
            key={persona.id}
            persona={persona}
            selected={selectedId === persona.id}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </ul>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            className="flex min-h-0 w-full flex-1 flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shrink-0">
              <p className="mb-0.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                {selected.title}
              </p>
              <h2 className="mb-2 text-[20px] font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-[22px]">
                {selected.name}
              </h2>

              {typeof selected.creditScore === "number" ? (
                <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-white px-3 py-1">
                  <span className="text-[12px] font-medium text-[var(--muted)]">
                    Credit score
                  </span>
                  <span className="text-[16px] font-bold tabular-nums tracking-tight text-[var(--ink)]">
                    {selected.creditScore}
                  </span>
                  <span className="rounded-[4px] bg-[#F4F4F1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                    {creditScoreLabel(selected.creditScore)}
                  </span>
                </div>
              ) : null}

              <p className="mb-2 line-clamp-2 text-[13px] leading-relaxed text-[var(--muted)] sm:text-[14px]">
                {selected.summary}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {selected.kind === "persona" ? (
                <BankStatementFeed
                  personaId={selected.id}
                  accountLabel={selected.accountLabel}
                  balance={selected.balance}
                  compact
                />
              ) : (
                <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[#FAFBFC] px-4 py-6 text-[13px] text-[var(--muted)]">
                  Connect your bank to build a custom spend profile from real
                  activity.
                </div>
              )}
            </div>

            <div className="mt-3 shrink-0">
              <motion.button
                type="button"
                onClick={onConnect}
                className="inline-flex h-[48px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-[var(--ink)] bg-[var(--ink)] px-[22px] text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(17,17,17,0.08)] sm:w-auto"
                whileHover={{
                  y: -2,
                  boxShadow: "0 4px 12px rgba(17,17,17,0.12)",
                }}
                whileTap={{ y: 1, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <Lock className="h-4 w-4" strokeWidth={1.75} />
                Connect bank account
              </motion.button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
                <Lock className="h-3 w-3" strokeWidth={1.75} />
                Bank-grade encryption. We never store credentials.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function PersonaIcon({
  persona,
  selected,
  index,
  onSelect,
}: {
  persona: PersonaOption;
  selected: boolean;
  index: number;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.08 + index * 0.07,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <motion.button
        type="button"
        onClick={() => onSelect(persona.id)}
        className="group flex w-[72px] flex-col items-center gap-1.5 focus-visible:outline-none sm:w-[100px] sm:gap-2"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        aria-pressed={selected}
      >
        <span
          className={`relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border-2 transition-colors sm:h-[80px] sm:w-[80px] ${
            selected
              ? "border-[var(--ink)] shadow-[0_8px_24px_rgba(17,17,17,0.12)]"
              : "border-[var(--border)] group-hover:border-[var(--ink)]"
          }`}
        >
          <PersonaCharacter
            personaId={persona.id}
            className="h-full w-full"
          />
        </span>
        <span className="text-[11px] font-medium leading-tight text-[var(--ink)] sm:text-[13px]">
          {persona.name}
        </span>
      </motion.button>
    </motion.li>
  );
}
