import type { CardBlurb } from "@/components/EmbeddingCloud";
import type { CardValue, CategoryTotals } from "@/lib/calculator";
import type { RankedRecommendation } from "@/lib/ranking";

export type PipelineHit = {
  id: string;
  name: string;
  issuer: string;
  score: number;
  angleDeg?: number;
  officialUrl?: string | null;
  blurb?: CardBlurb | null;
};

export type PipelinePayload = {
  cardCount: number;
  fingerprint: string;
  model?: string;
  embedPreview?: number[];
  userPoint: { x: number; y: number; z: number };
  points: unknown[];
  topK: PipelineHit[];
  /** The user's current card, priced and ranked against with rewards/calculator.py's logic. */
  currentCardId: string | null;
  currentCardName: string | null;
  currentCardIssuer: string | null;
  currentCardValue: CardValue | null;
  /** Real recommendations, ranked by net_annual_value_usd delta vs. the current card. */
  recommendations: RankedRecommendation[];
  categoryTotals: CategoryTotals;
};

