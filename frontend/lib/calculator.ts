/**
 * Compute a card's projected annual reward value given category spend totals.
 *
 * Ported from rewards/calculator.py (Python) -- keep in sync if that file
 * changes. See that file's docstring for the full rationale; summarized:
 *
 * Known limitation: each taxonomy category is capped against its own matched
 * earn_rate independently. Real issuer caps that pool multiple taxonomy
 * categories under one bonus line (e.g. "streaming + online grocery") are not
 * modeled as a combined cap here -- not worth the complexity for a demo.
 *
 * Benefits and earn rates are both priced as best-case projections: a benefit
 * counts at full face value once its cadence and any enrollment/activation
 * friction are applied (no attempt to model whether this specific user would
 * actually redeem it). Earn rates gated behind a portal/booking requirement
 * (e.g. "booked through Citi Travel") are similarly assumed fully achievable.
 * The one exception is rotating/flexible categories (e.g. "quarterly rotating
 * categories"): real programs only activate one such category at a time, so
 * applying the bonus rate to every FLEXIBLE_TARGETS category simultaneously
 * would fabricate money that cannot exist even in the best case -- that case
 * is restricted to the user's single highest-spend eligible category instead.
 */

import {
  BENEFIT_CATEGORY,
  BENEFIT_TOKENS,
  Category,
  FLEXIBLE_CATEGORY_MARKERS,
  FLEXIBLE_TARGETS,
  mapCategories,
  matchTokens,
} from "./taxonomy";

export type EarnRate = {
  category: string;
  rate: number;
  unit: string;
  spend_cap_usd?: number | null;
  cap_period?: string | null;
  portal_or_booking_requirement?: string | null;
  merchant_or_channel_restriction?: string | null;
  notes?: string | null;
};

export type Benefit = {
  name: string;
  value_usd: number;
  frequency: string | null;
  category?: string | null;
  requires_activation?: boolean | null;
  enrollment_required?: boolean | null;
  conditions?: string | null;
};

export type CardMetadata = {
  id: string;
  annual_fee_usd: number;
  reward_currency?: string | null;
  point_value_estimate_cpp?: number | null;
  earn_rates: EarnRate[];
  credits_and_benefits?: Benefit[];
  audience?: string | null;
  [key: string]: unknown;
};

export type CategoryTotals = Record<string, number>;

const CAP_PERIOD_ANNUAL_MULTIPLIER: Record<string, number> = {
  "calendar year": 1,
  "account anniversary year": 1,
  quarter: 4,
  "billing cycle": 12,
};

const DEFAULT_CPP_BY_CURRENCY: Record<string, number> = { points: 1.0, miles: 1.3 };
const DEFAULT_CPP_FALLBACK = 1.0;

// value_usd is already the annualized total for these cadences (verified
// against issuer terms) -- only "every four years" needs discounting to a
// per-year share. frequency: null is genuinely unknown cadence -> excluded.
const FREQUENCY_ANNUAL_MULTIPLIER: Record<string, number> = {
  annual: 1.0,
  monthly: 1.0,
  quarterly: 1.0,
  semiannual: 1.0,
  "every four years": 0.25,
};

const FRICTION_DISCOUNT = 0.85;

/**
 * Only one rotating/flexible category can realistically be "on" at once.
 * Best-case assumption: it's whichever FLEXIBLE_TARGETS category the user
 * spends the most in. If the user has no spend in any of them, the bonus
 * has nothing to attach to.
 */
function flexibleTargetCategories(categoryTotals: CategoryTotals): Category[] {
  const eligible = FLEXIBLE_TARGETS.filter((category) => (categoryTotals[category] ?? 0) > 0);
  if (!eligible.length) return [];
  return [eligible.reduce((best, c) => (categoryTotals[c] > categoryTotals[best] ? c : best))];
}

function earnRatesByTaxonomyCategory(
  card: CardMetadata,
  categoryTotals: CategoryTotals,
): Map<Category, EarnRate[]> {
  const profile = new Map<Category, EarnRate[]>();
  for (const earnRate of card.earn_rates) {
    const label = earnRate.category.toLowerCase();
    const categories = FLEXIBLE_CATEGORY_MARKERS.some((marker) => label.includes(marker))
      ? flexibleTargetCategories(categoryTotals)
      : mapCategories(label);
    for (const category of categories) {
      const list = profile.get(category) ?? [];
      list.push(earnRate);
      profile.set(category, list);
    }
  }
  return profile;
}

function baseRate(card: CardMetadata): EarnRate {
  const allOther = card.earn_rates.find((er) => er.category.toLowerCase().includes("all other"));
  if (allOther) return allOther;
  const uncapped = card.earn_rates.filter((er) => !er.spend_cap_usd);
  const pool = uncapped.length ? uncapped : card.earn_rates;
  return pool.reduce((min, er) => (er.rate < min.rate ? er : min));
}

function resolveCpp(card: CardMetadata): number {
  if (card.point_value_estimate_cpp != null) return card.point_value_estimate_cpp;
  return DEFAULT_CPP_BY_CURRENCY[card.reward_currency ?? ""] ?? DEFAULT_CPP_FALLBACK;
}

function rateToDollars(spend: number, rate: number, unit: string, cpp: number): number {
  if (unit === "percent_cashback") return spend * (rate / 100);
  return spend * rate * (cpp / 100);
}

function annualCap(earnRate: EarnRate): number | null {
  const cap = earnRate.spend_cap_usd;
  if (!cap) return null;
  const multiplier = CAP_PERIOD_ANNUAL_MULTIPLIER[earnRate.cap_period ?? ""] ?? 1;
  return cap * multiplier;
}

function valueForEarnRate(
  spend: number,
  earnRate: EarnRate,
  base: EarnRate,
  cpp: number,
): { value: number; capped: boolean } {
  const cap = annualCap(earnRate);
  if (cap == null) {
    return { value: rateToDollars(spend, earnRate.rate, earnRate.unit, cpp), capped: false };
  }
  const eligible = Math.min(spend, cap);
  const overflow = Math.max(spend - cap, 0);
  const value =
    rateToDollars(eligible, earnRate.rate, earnRate.unit, cpp) +
    rateToDollars(overflow, base.rate, base.unit, cpp);
  return { value, capped: true };
}

/** Informational only (shown in the breakdown) -- does not affect pricing. */
function benefitCategory(benefit: Benefit): Category | null {
  const text = `${benefit.name ?? ""} ${benefit.conditions ?? ""}`;
  for (const token of matchTokens(text, BENEFIT_TOKENS)) {
    const category = BENEFIT_CATEGORY[token];
    if (category) return category;
  }
  return null;
}

export type PricedBenefit = {
  name: string;
  category: Category | null;
  value_usd: number;
  frequency_multiplier: number;
  friction_multiplier: number;
  priced_value_usd: number;
};

function pricedBenefit(benefit: Benefit): PricedBenefit | null {
  const frequencyMultiplier = FREQUENCY_ANNUAL_MULTIPLIER[benefit.frequency ?? ""];
  if (frequencyMultiplier == null) return null;

  const frictionMultiplier =
    benefit.enrollment_required || benefit.requires_activation ? FRICTION_DISCOUNT : 1.0;
  const valueUsd = benefit.value_usd;
  const pricedValue = valueUsd * frequencyMultiplier * frictionMultiplier;

  return {
    name: benefit.name,
    category: benefitCategory(benefit),
    value_usd: valueUsd,
    frequency_multiplier: frequencyMultiplier,
    friction_multiplier: frictionMultiplier,
    priced_value_usd: round2(pricedValue),
  };
}

function priceBenefits(card: CardMetadata): { total: number; priced: PricedBenefit[] } {
  const priced = (card.credits_and_benefits ?? [])
    .map(pricedBenefit)
    .filter((b): b is PricedBenefit => b !== null);
  const total = priced.reduce((sum, item) => sum + item.priced_value_usd, 0);
  return { total: round2(total), priced };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type CategoryBreakdown = {
  spend_usd: number;
  matched_label: string | null;
  rate: number;
  unit: string;
  capped: boolean;
  reward_value_usd: number;
};

export type CardValue = {
  card_id: string;
  annual_fee_usd: number;
  total_reward_value_usd: number;
  net_annual_value_usd: number;
  by_category: Record<string, CategoryBreakdown>;
  priced_benefits: PricedBenefit[];
};

export function calculateCardValue(card: CardMetadata, categoryTotals: CategoryTotals): CardValue {
  const cpp = resolveCpp(card);
  const base = baseRate(card);
  const ratesByCategory = earnRatesByTaxonomyCategory(card, categoryTotals);

  const byCategory: Record<string, CategoryBreakdown> = {};
  let totalRewardValue = 0;

  for (const [category, spend] of Object.entries(categoryTotals)) {
    const candidates = ratesByCategory.get(category as Category) ?? [];
    let bestEarnRate: EarnRate | null = null;
    let bestValue = -1;
    let bestCapped = false;

    for (const earnRate of candidates) {
      const { value, capped } = valueForEarnRate(spend, earnRate, base, cpp);
      if (value > bestValue) {
        bestEarnRate = earnRate;
        bestValue = value;
        bestCapped = capped;
      }
    }

    let matchedLabel: string | null;
    let rate: number;
    let unit: string;
    let rewardValue: number;
    let capped: boolean;

    if (bestEarnRate) {
      matchedLabel = bestEarnRate.category;
      rate = bestEarnRate.rate;
      unit = bestEarnRate.unit;
      rewardValue = round2(bestValue);
      capped = bestCapped;
    } else {
      matchedLabel = null;
      rate = base.rate;
      unit = base.unit;
      rewardValue = round2(rateToDollars(spend, rate, unit, cpp));
      capped = false;
    }

    byCategory[category] = {
      spend_usd: round2(spend),
      matched_label: matchedLabel,
      rate,
      unit,
      capped,
      reward_value_usd: rewardValue,
    };
    totalRewardValue += rewardValue;
  }

  const { total: benefitsValue, priced: pricedBenefits } = priceBenefits(card);
  totalRewardValue += benefitsValue;

  const annualFee = card.annual_fee_usd;
  return {
    card_id: card.id,
    annual_fee_usd: annualFee,
    total_reward_value_usd: round2(totalRewardValue),
    net_annual_value_usd: round2(totalRewardValue - annualFee),
    by_category: byCategory,
    priced_benefits: pricedBenefits,
  };
}
