"""Embed sample personas and check kNN recall against expected cards."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from personas import PERSONAS
from preprocess.persona import render_user_persona
from redis_store.store import CardRedis

ROOT = Path(__file__).resolve().parents[1]
MODEL = "text-embedding-3-small"
K = 10


def main() -> None:
    load_dotenv(ROOT / ".env.local")
    load_dotenv()
    client = OpenAI()
    store = CardRedis()
    print(f"Redis cards: {len(store.list_card_ids())}")

    for card_id in (
        "citi-double-cash",
        "discover-it-cash-back",
        "chase-freedom-flex",
        "american-express-gold-card",
    ):
        card = store.get_card(card_id)
        assert card is not None
        print(f"--- {card_id}")
        for line in card["embedding_text"].splitlines():
            if line.startswith(
                (
                    "reward_style",
                    "primary_goals",
                    "category_profile",
                    "lifestyle",
                    "summary",
                )
            ):
                print(line)

    print()
    for persona in PERSONAS:
        text = render_user_persona(persona["profile"])
        embedding = client.embeddings.create(model=MODEL, input=[text]).data[0].embedding
        hits = store.knn_search(embedding, k=K)
        hit_ids = [hit["id"] for hit in hits]
        expect = persona["expect"]
        found = [card_id for card_id in expect if card_id in hit_ids]
        missing = [card_id for card_id in expect if card_id not in hit_ids]

        print("=" * 60)
        print(f"{persona['id']} | {persona['label']}")
        print(f"top {K}:")
        for index, hit in enumerate(hits, 1):
            mark = " *" if hit["id"] in expect else ""
            print(f"  {index:2d}. {hit['id']:55s} {hit['score']:.4f}{mark}")
        print(f"expect hit {len(found)}/{len(expect)}: {found}")
        if missing:
            print(f"MISSING from top {K}: {missing}")
        else:
            print(f"ALL expected cards in top {K}")


if __name__ == "__main__":
    main()
