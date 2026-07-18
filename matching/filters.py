"""Hard filters over kNN candidates: audience, fee tier, APR, current card."""

from __future__ import annotations

from preprocess.taxonomy import fee_tier

_FEE_TIER_RANK = {"zero": 0, "low": 1, "mid": 2, "high": 3, "premium": 4}


def apply_hard_filters(
    hits: list[dict], persona_profile: dict, current_card_id: str
) -> list[dict]:
    audience = persona_profile.get("audience", "consumer")
    max_fee_rank = _FEE_TIER_RANK[persona_profile["fee_tier"]]
    max_apr = persona_profile.get("max_purchase_apr_pct")

    out = []
    for hit in hits:
        card = hit["metadata"]
        if card["id"] == current_card_id:
            continue
        if card.get("audience") != audience:
            continue
        if _FEE_TIER_RANK[fee_tier(card["annual_fee_usd"])] > max_fee_rank:
            continue
        apr_min = (card.get("apr") or {}).get("purchase_apr_min_pct")
        if max_apr is not None and apr_min is not None and apr_min > max_apr:
            continue
        out.append(hit)
    return out
