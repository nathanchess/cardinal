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
      "Answer a few questions about your spending, fees, and travel goals so we can match cards to you—not a preset persona.",
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
