/** Aggregate transactions into annual category totals. Ported from transactions/aggregate.py. */

import type { CategoryTotals } from "./calculator";
import type { PersonaTransaction } from "@/data/transactions";

export function aggregateAnnualTotals(transactions: PersonaTransaction[]): CategoryTotals {
  const totals: CategoryTotals = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }
  for (const category of Object.keys(totals)) {
    totals[category] = Math.round(totals[category] * 100) / 100;
  }
  return totals;
}
