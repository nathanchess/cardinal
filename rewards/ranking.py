"""Rank kNN card candidates by projected dollar savings vs. the user's current card."""

from __future__ import annotations

from matching.filters import apply_hard_filters
from rewards.calculator import calculate_card_value

TOP_N = 3


def rank_candidates(
    hits: list[dict],
    persona_profile: dict,
    current_card_id: str,
    current_card_metadata: dict,
    category_totals: dict[str, float],
) -> list[dict]:
    candidates = apply_hard_filters(hits, persona_profile, current_card_id)
    current_value = calculate_card_value(current_card_metadata, category_totals)

    scored = []
    for hit in candidates:
        value = calculate_card_value(hit["metadata"], category_totals)
        delta = round(
            value["net_annual_value_usd"] - current_value["net_annual_value_usd"], 2
        )
        scored.append(
            {
                "card_id": hit["id"],
                "name": hit["name"],
                "issuer": hit["issuer"],
                "delta_usd": delta,
                "card_value": value,
            }
        )

    scored.sort(key=lambda item: item["delta_usd"], reverse=True)
    return [item for item in scored if item["delta_usd"] > 0][:TOP_N]
