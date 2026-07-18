export type PersonaOption = {
  id: string;
  name: string;
  title: string;
  summary: string;
  kind: "persona" | "custom";
  accountLabel?: string;
  /** FICO-style score shown on the persona pick page */
  creditScore?: number;
  /** Checking available balance for the fake statement header */
  balance?: number;
  /**
   * The card this persona currently holds. Ranking/value math is a delta
   * against this card's own calculate_card_value() result, not a standalone
   * score -- mirrors personas/registry.py on the Python side.
   */
  currentCardId?: string;
  /** consumer vs small_business hard filter, mirrors registry.py's profile.audience */
  audience?: "consumer" | "small_business";
};

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: "urban_diner",
    name: "Maya Chen",
    title: "Urban diner",
    summary:
      "City professional who eats out constantly, shops groceries weekly, and will pay a mid annual fee for strong dining and grocery rewards.",
    kind: "persona",
    accountLabel: "TOTAL CHECKING",
    creditScore: 742,
    balance: 6842.17,
    currentCardId: "wells-fargo-active-cash",
    audience: "consumer",
  },
  {
    id: "no_fee_cashback",
    name: "Jordan Hale",
    title: "Simple cashback",
    summary:
      "Wants a free card with straightforward cash back and no portals, credits, or points strategy.",
    kind: "persona",
    accountLabel: "EVERYDAY CHECKING",
    creditScore: 691,
    balance: 2148.53,
    currentCardId: "amex-everyday-preferred-credit-card",
    audience: "consumer",
  },
  {
    id: "delta_premium_flyer",
    name: "Priya Shah",
    title: "Frequent flyer",
    summary:
      "Flies Delta often, books hotels regularly, and will pay a premium annual fee for lounge access and airline perks.",
    kind: "persona",
    accountLabel: "PREMIER CHECKING",
    creditScore: 798,
    balance: 18420.66,
    currentCardId: "citi-double-cash",
    audience: "consumer",
  },
  {
    id: "custom",
    name: "Custom profile",
    title: "Build your own",
    summary:
      "Answer a few questions about your spending, fees, and travel goals so we can match cards to you, not a preset persona.",
    kind: "custom",
  },
];

export function creditScoreLabel(score: number) {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Building";
}

/** Persona fields that feed the embedding (intensities, not dollar amounts). */
export type PersonaEmbedProfile = {
  feeTier: string;
  rewardStyles: string[];
  primaryGoals: string[];
  lifestyleTags: string[];
  spendProfile: Record<string, string>;
};

export const PERSONA_EMBED_PROFILES: Record<string, PersonaEmbedProfile> = {
  urban_diner: {
    feeTier: "high",
    rewardStyles: ["transferable_points"],
    primaryGoals: ["maximize_rewards", "travel_redemption"],
    lifestyleTags: ["diner", "grocery_shopper", "flyer"],
    spendProfile: {
      dining: "high",
      groceries: "high",
      travel_flights: "medium",
      streaming: "base",
      general: "base",
    },
  },
  no_fee_cashback: {
    feeTier: "zero",
    rewardStyles: ["cashback"],
    primaryGoals: ["minimize_fees", "simple_cashback"],
    lifestyleTags: ["driver", "grocery_shopper"],
    spendProfile: {
      general: "high",
      gas: "medium",
      groceries: "medium",
      dining: "base",
    },
  },
  delta_premium_flyer: {
    feeTier: "premium",
    rewardStyles: ["airline_miles"],
    primaryGoals: ["airline_loyalty", "travel_redemption", "premium_benefits"],
    lifestyleTags: ["flyer", "hotel_traveler", "diner"],
    spendProfile: {
      travel_flights: "high",
      travel_hotels: "high",
      dining: "medium",
      general: "base",
    },
  },
};

function humanizeKey(key: string) {
  return key.replace(/_/g, " ");
}

/** Chips that fly into the OpenAI embed viz (stores + qualitative metadata). */
export function buildEmbedFlingChips(personaId: string, merchants: string[]) {
  const profile = PERSONA_EMBED_PROFILES[personaId];
  const chips: {
    id: string;
    label: string;
    kind: "merchant" | "intensity" | "meta";
    category?: string;
  }[] = [];

  const uniqueMerchants = [...new Set(merchants)].slice(0, 8);
  for (const merchant of uniqueMerchants) {
    chips.push({ id: `m-${merchant}`, label: merchant, kind: "merchant" });
  }

  if (!profile) return chips;

  for (const [category, intensity] of Object.entries(profile.spendProfile)) {
    chips.push({
      id: `i-${category}`,
      label: `${humanizeKey(category)} · ${intensity}`,
      kind: "intensity",
      category,
    });
  }

  chips.push({
    id: "fee",
    label: `fee tier · ${profile.feeTier}`,
    kind: "meta",
  });

  for (const style of profile.rewardStyles) {
    chips.push({
      id: `rs-${style}`,
      label: humanizeKey(style),
      kind: "meta",
    });
  }

  for (const goal of profile.primaryGoals.slice(0, 2)) {
    chips.push({
      id: `g-${goal}`,
      label: humanizeKey(goal),
      kind: "meta",
    });
  }

  for (const tag of profile.lifestyleTags) {
    chips.push({
      id: `t-${tag}`,
      label: humanizeKey(tag),
      kind: "meta",
    });
  }

  return chips;
}
