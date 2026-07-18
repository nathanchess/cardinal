import deltaPremiumFlyer from "./delta_premium_flyer.json";
import noFeeCashback from "./no_fee_cashback.json";
import urbanDiner from "./urban_diner.json";

export type PersonaTransaction = {
  date: string;
  merchant: string;
  amount: number;
  category: string;
};

export type PersonaTransactionFeed = {
  persona_id: string;
  transactions: PersonaTransaction[];
};

export const PERSONA_TRANSACTIONS: Record<string, PersonaTransactionFeed> = {
  urban_diner: urbanDiner as PersonaTransactionFeed,
  no_fee_cashback: noFeeCashback as PersonaTransactionFeed,
  delta_premium_flyer: deltaPremiumFlyer as PersonaTransactionFeed,
};

export const CATEGORY_STYLES: Record<
  string,
  { label: string; color: string; amountWeight: number }
> = {
  dining: { label: "Dining", color: "#E85D4C", amountWeight: 700 },
  groceries: { label: "Groceries", color: "#3D9A5F", amountWeight: 600 },
  travel_flights: { label: "Flights", color: "#1B6BC4", amountWeight: 700 },
  travel_hotels: { label: "Hotels", color: "#5B4FCF", amountWeight: 600 },
  travel_other: { label: "Travel", color: "#2A8FBD", amountWeight: 600 },
  gas: { label: "Gas", color: "#C47A12", amountWeight: 600 },
  streaming: { label: "Streaming", color: "#9B4DCA", amountWeight: 500 },
  entertainment: { label: "Entertainment", color: "#D64B8C", amountWeight: 600 },
  online_shopping: { label: "Online", color: "#0F8A8A", amountWeight: 600 },
  drugstores: { label: "Health", color: "#4A90A4", amountWeight: 500 },
  utilities: { label: "Utilities", color: "#6B6B66", amountWeight: 500 },
  wholesale_clubs: { label: "Wholesale", color: "#5A7A3A", amountWeight: 600 },
  general: { label: "Shopping", color: "#4A4A45", amountWeight: 500 },
};

export function getCategoryStyle(category: string) {
  return (
    CATEGORY_STYLES[category] ?? {
      label: category.replace(/_/g, " "),
      color: "#6B6B66",
      amountWeight: 500,
    }
  );
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatTxnDate(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
