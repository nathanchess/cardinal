/**
 * Shared vocabulary for card earn-rate/benefit categorization.
 *
 * Ported from preprocess/taxonomy.py (Python) -- keep in sync if that file
 * changes. Only the pieces the value calculator needs are ported here
 * (not the full embedding-text vocabulary).
 */

export const CATEGORIES = [
  "dining",
  "groceries",
  "gas",
  "transit",
  "travel_flights",
  "travel_hotels",
  "travel_other",
  "streaming",
  "drugstores",
  "online_shopping",
  "wholesale_clubs",
  "utilities",
  "entertainment",
  "general",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_RULES: [string[], Category][] = [
  [["wholesale"], "wholesale_clubs"],
  [["drugstore", "pharmacy"], "drugstores"],
  [["streaming"], "streaming"],
  [["online retail", "online shopping"], "online_shopping"],
  [["supermarket", "grocery", "grocer"], "groceries"],
  [["dining", "restaurant", "takeout", "food delivery"], "dining"],
  [["gas station", "ev charging", "electric vehicle"], "gas"],
  [["transit", "commuting", "rideshare"], "transit"],
  [
    [
      "flight",
      "airline",
      "air travel",
      "air canada",
      "delta purchase",
      "united purchase",
      "southwest purchase",
      "alaska airline",
    ],
    "travel_flights",
  ],
  [["hotel", "marriott", "hilton", "hyatt", "ihg", "vacation rental"], "travel_hotels"],
  [["rental car", "car rental", "cruise", "travel"], "travel_other"],
  [["entertainment", "fitness", "gym", "recreation", "self-care"], "entertainment"],
  [["utility", "phone plan", "internet", "cable", "shipping", "advertising"], "utilities"],
  [["rent payment", "all other", "eligible purchase"], "general"],
];

export const FLEXIBLE_CATEGORY_MARKERS = [
  "highest eligible",
  "rotating",
  "selected everyday",
  "selected choice",
  "selected category",
  "two selected",
  "two eligible",
];

export const FLEXIBLE_TARGETS: Category[] = [
  "dining",
  "groceries",
  "gas",
  "transit",
  "streaming",
  "drugstores",
  "online_shopping",
];

export const BENEFIT_TOKENS: [string, string][] = [
  ["hotel credit", "hotel_credit"],
  ["travel credit", "travel_credit"],
  ["dining credit", "dining_credit"],
  ["resy", "dining_credit"],
  ["uber", "rideshare_credit"],
  ["global entry", "global_entry_credit"],
  ["tsa precheck", "tsa_precheck_credit"],
  ["lounge", "lounge_access"],
  ["checked bag", "checked_bag"],
  ["priority boarding", "priority_boarding"],
  ["companion", "companion_pass"],
  ["free night", "free_night"],
  ["hotel status", "hotel_status"],
  ["trip cancellation", "trip_protection"],
  ["trip delay", "trip_protection"],
  ["trip interruption", "trip_protection"],
  ["purchase protection", "purchase_protection"],
  ["extended warranty", "warranty_protection"],
  ["cell phone", "cell_phone_protection"],
  ["rental", "rental_car_protection"],
];

export const BENEFIT_CATEGORY: Record<string, Category> = {
  hotel_credit: "travel_hotels",
  travel_credit: "travel_other",
  dining_credit: "dining",
  rideshare_credit: "transit",
  global_entry_credit: "travel_flights",
  tsa_precheck_credit: "travel_flights",
  lounge_access: "travel_flights",
  checked_bag: "travel_flights",
  priority_boarding: "travel_flights",
  companion_pass: "travel_flights",
  free_night: "travel_hotels",
  hotel_status: "travel_hotels",
  trip_protection: "travel_other",
  purchase_protection: "general",
  warranty_protection: "general",
  cell_phone_protection: "utilities",
  rental_car_protection: "travel_other",
};

export function mapCategories(label: string): Category[] {
  const text = label.toLowerCase();
  const categories = CATEGORY_RULES.filter(([keywords]) =>
    keywords.some((keyword) => text.includes(keyword)),
  ).map(([, category]) => category);
  return categories.length ? categories : ["general"];
}

/** Dedupes while preserving first-seen order, same as Python's dict.fromkeys(). */
export function matchTokens(text: string, rules: [string, string][]): string[] {
  const lowered = text.toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const [needle, token] of rules) {
    if (lowered.includes(needle) && !seen.has(token)) {
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}
