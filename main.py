"""Run kNN card search for each sample persona and print results."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from personas import PERSONAS
from preprocess.persona import render_user_persona
from redis_store.store import CardRedis

ROOT = Path(__file__).resolve().parent
MODEL = "text-embedding-3-small"
K = 10


def _join(values: list[str] | None) -> str:
    return ", ".join(values) if values else "n/a"


def print_persona(persona: dict) -> None:
    profile = persona["profile"]
    print("=" * 72)
    print(f"persona: {persona['id']}")
    print(f"label:   {persona['label']}")
    print(f"current: {persona['current_card_id']}")
    print(f"audience / fee_tier: {profile.get('audience', 'consumer')} / {profile['fee_tier']}")
    print(f"goals:   {_join(profile.get('primary_goals'))}")
    print(f"style:   {_join(profile.get('reward_style'))}")
    print(
        f"spend:   {_join([f'{cat}={tier}' for cat, tier in profile['spend_profile'].items()])}"
    )
    print(f"loyalty: {_join(profile.get('loyalty_programs'))}")
    print(f"channels: {_join(profile.get('booking_channels'))}")
    print(f"benefits: {_join(profile.get('benefit_profile'))}")
    print(f"tags:    {_join(profile.get('lifestyle_tags'))}")
    print(f"summary: {profile['summary'].strip()}")
    print(f"expect:  {_join(persona.get('expect'))}")


def main() -> None:
    load_dotenv(ROOT / ".env.local")
    load_dotenv()

    client = OpenAI()
    store = CardRedis()
    print(f"Redis cards indexed: {len(store.list_card_ids())}")
    print(f"kNN k={K}  model={MODEL}")
    print()

    for persona in PERSONAS:
        print_persona(persona)

        text = render_user_persona(persona["profile"])
        embedding = client.embeddings.create(model=MODEL, input=[text]).data[0].embedding
        hits = store.knn_search(embedding, k=K)
        expect = set(persona.get("expect") or [])

        print(f"\nkNN top {K}:")
        for index, hit in enumerate(hits, 1):
            mark = "  <- expect" if hit["id"] in expect else ""
            print(
                f"  {index:2d}. {hit['name']}"
                f"  ({hit['id']})"
                f"  score={hit['score']:.4f}{mark}"
            )

        hit_ids = {hit["id"] for hit in hits}
        found = [card_id for card_id in persona.get("expect") or [] if card_id in hit_ids]
        missing = [card_id for card_id in persona.get("expect") or [] if card_id not in hit_ids]
        print(f"\nexpect in top {K}: {len(found)}/{len(persona.get('expect') or [])}")
        if missing:
            print(f"missing: {_join(missing)}")
        print()


if __name__ == "__main__":
    main()
