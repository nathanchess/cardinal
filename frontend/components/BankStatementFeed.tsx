"use client";

import { useMemo } from "react";
import {
  formatMoney,
  formatTxnDate,
  getCategoryStyle,
  PERSONA_TRANSACTIONS,
  type PersonaTransaction,
} from "@/data/transactions";

type BankStatementFeedProps = {
  personaId: string;
  accountLabel?: string;
  balance?: number;
  compact?: boolean;
};

export function BankStatementFeed({
  personaId,
  accountLabel = "TOTAL CHECKING",
  balance: balanceProp,
  compact = false,
}: BankStatementFeedProps) {
  const feed = PERSONA_TRANSACTIONS[personaId];
  const transactions = feed?.transactions ?? [];

  const balance = useMemo(() => {
    if (typeof balanceProp === "number") return balanceProp;
    const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.max(4200, 18500 - spent * 0.08);
  }, [balanceProp, transactions]);

  const loop = useMemo(() => [...transactions].reverse(), [transactions]);

  if (!transactions.length) return null;

  return (
    <div className="w-full overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-left shadow-[0_8px_28px_rgba(17,17,17,0.06)]">
      <div
        className={`bg-[var(--ink)] text-white ${compact ? "px-3.5 py-2.5" : "px-4 py-3"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`font-semibold tracking-wide ${compact ? "text-[13px]" : "text-[13px]"}`}
            >
              {accountLabel}
            </p>
            <p className="mt-0.5 text-[11px] text-white/65">...4821</p>
          </div>
          <div className="text-right">
            <p
              className={`font-bold leading-none tracking-tight ${compact ? "text-[18px]" : "text-[18px]"}`}
            >
              {formatMoney(balance)}
            </p>
            <p className="mt-1 text-[11px] text-white/65">Available balance</p>
          </div>
        </div>
      </div>

      <div
        className={`border-b border-[var(--border)] ${compact ? "px-3.5 py-2" : "px-4 py-2.5"}`}
      >
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          Recent activity
        </p>
      </div>

      <div
        className={`relative overflow-hidden bg-[#FAFAF8] ${compact ? "h-[min(168px,22vh)]" : "h-[220px]"}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#FAFAF8] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#FAFAF8] to-transparent" />

        <div className="animate-statement-scroll will-change-transform">
          <TxnList rows={loop} />
          <TxnList rows={loop} ariaHidden />
        </div>
      </div>
    </div>
  );
}

function TxnList({
  rows,
  ariaHidden,
}: {
  rows: PersonaTransaction[];
  ariaHidden?: boolean;
}) {
  return (
    <ul className="divide-y divide-[var(--border)]" aria-hidden={ariaHidden}>
      {rows.map((txn, index) => {
        const style = getCategoryStyle(txn.category);
        return (
          <li
            key={`${txn.date}-${txn.merchant}-${index}`}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink)] sm:text-[15px]">
                {txn.merchant}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="inline-flex rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em]"
                  style={{
                    color: style.color,
                    backgroundColor: `${style.color}18`,
                  }}
                >
                  {style.label}
                </span>
                <span className="text-[11px] text-[var(--muted)] sm:text-[12px]">
                  {formatTxnDate(txn.date)}
                </span>
              </div>
            </div>
            <p
              className="shrink-0 text-[14px] tabular-nums tracking-tight text-[var(--ink)] sm:text-[15px]"
              style={{ fontWeight: style.amountWeight }}
            >
              −{formatMoney(txn.amount)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
