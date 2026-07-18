import { BACKGROUND_CARDS } from "@/data/floating-cards";
import cardArtMap from "@/data/card-art-map.json";

const ART_MAP = cardArtMap as Record<string, string>;

/** Resolve local card art when we have a matching public asset. */
export function resolveCardArt(cardId: string): string | null {
  if (ART_MAP[cardId]) return ART_MAP[cardId]!;

  const exact = BACKGROUND_CARDS.find((c) => c.id === cardId);
  if (exact) return exact.src;

  const aliases: Record<string, string> = {
    "amex-gold": "/cards/amex-gold.png",
    "capital-one-venture-x": "/cards/capital-one-venture-x.png",
  };
  if (aliases[cardId]) return aliases[cardId]!;

  const partial = BACKGROUND_CARDS.find(
    (c) => cardId.includes(c.id) || c.id.includes(cardId),
  );
  if (partial?.src) return partial.src;

  // Fuzzy: map keys that share a strong substring with the catalog id
  const hit = Object.keys(ART_MAP).find(
    (id) => cardId.includes(id) || id.includes(cardId),
  );
  return hit ? ART_MAP[hit]! : null;
}
