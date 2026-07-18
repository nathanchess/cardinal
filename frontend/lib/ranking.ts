/**
 * Rank kNN card candidates by projected dollar savings vs. the user's current card.
 *
 * Ported from matching/filters.py + rewards/ranking.py (Python) -- keep in
 * sync if those files change.
 *
 * Two hard gates (not scored, always applied): audience match and excluding
 * the user's current card. Everything else (fee, APR, welcome bonus) is not
 * a hard constraint -- it falls out of the dollar comparison. Candidates are
 * ranked purely by net_annual_value_usd delta vs. the current card: kNN's
 * job is recall (the semantically-qualified candidate set passed in here),
 * and dollar savings is the sole, more explainable ranking signal within
 * that set -- even when it disagrees with similarity. Every candidate that
 * survives the hard gates is returned, ranked best-to-worst by delta -- not
 * just the ones that beat the current card -- so the full comparison set is
 * visible, not only "winners".
 */

import { calculateCardValue, CardMetadata, CardValue, CategoryTotals } from "./calculator";

const TOP_N = 10;

export type RankCandidate = {
  id: string;
  name: string;
  issuer: string;
  metadata: CardMetadata;
};

export type RankedRecommendation = {
  card_id: string;
  name: string;
  issuer: string;
  delta_usd: number;
  card_value: CardValue;
};

function applyHardFilters(
  candidates: RankCandidate[],
  audience: string,
  currentCardId: string,
): RankCandidate[] {
  return candidates.filter(
    (c) => c.metadata.id !== currentCardId && (c.metadata.audience ?? "consumer") === audience,
  );
}

export function rankCandidates(
  candidates: RankCandidate[],
  audience: string,
  currentCardId: string,
  currentCardMetadata: CardMetadata,
  categoryTotals: CategoryTotals,
): RankedRecommendation[] {
  const filtered = applyHardFilters(candidates, audience, currentCardId);
  const currentValue = calculateCardValue(currentCardMetadata, categoryTotals);

  const scored = filtered.map((candidate) => {
    const value = calculateCardValue(candidate.metadata, categoryTotals);
    const delta = Math.round((value.net_annual_value_usd - currentValue.net_annual_value_usd) * 100) / 100;
    return {
      card_id: candidate.id,
      name: candidate.name,
      issuer: candidate.issuer,
      delta_usd: delta,
      card_value: value,
    };
  });

  scored.sort((a, b) => b.delta_usd - a.delta_usd);
  return scored.slice(0, TOP_N);
}
