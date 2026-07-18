"""Build card embeddings and load them into Redis with vector search."""

from __future__ import annotations

import json
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from preprocess.persona import render_card_persona
from redis_store.store import CardRedis

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "credit_cards.json"
EMBEDDINGS_PATH = ROOT / "data" / "card_embeddings.json"
MODEL = "text-embedding-3-small"


def prepare_catalog() -> list[dict]:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    cards = catalog["cards"]
    for card in cards:
        card["embedding_text"] = render_card_persona(card)
    catalog["metadata"]["embedding_strategy"] = (
        "Parallel CARD_PERSONA / USER_PERSONA strings use shared categorical "
        "vocabulary for audience, goals, reward_style, fee_tier, category "
        "strength, booking channels, loyalty programs, and benefits. Exact "
        "fees, rates, offers, and APRs stay in metadata for deterministic scoring."
    )
    CATALOG_PATH.write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return cards


def build_embedding_cache(cards: list[dict]) -> dict:
    client = OpenAI()
    response = client.embeddings.create(
        model=MODEL,
        input=[card["embedding_text"] for card in cards],
    )
    vectors = [
        item.embedding for item in sorted(response.data, key=lambda item: item.index)
    ]
    cache = {
        "model": MODEL,
        "dimensions": len(vectors[0]),
        "cards": [
            {
                "id": card["id"],
                "embedding_text": card["embedding_text"],
                "embedding": vector,
            }
            for card, vector in zip(cards, vectors, strict=True)
        ],
    }
    EMBEDDINGS_PATH.write_text(
        json.dumps(cache, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    return cache


def main() -> None:
    load_dotenv(ROOT / ".env.local")
    load_dotenv()
    cards = prepare_catalog()
    cache = build_embedding_cache(cards)
    store = CardRedis()
    count = store.load_catalog()
    sample = store.get_card(cards[0]["id"])
    neighbors = store.knn_search(sample["embedding"], k=3)
    print(f"Embedded {len(cache['cards'])} cards ({cache['dimensions']} dims)")
    print(f"Loaded {count} cards into Redis with index idx:cards")
    print("Sample KNN:", [(hit["id"], round(hit["score"], 4)) for hit in neighbors])


if __name__ == "__main__":
    main()