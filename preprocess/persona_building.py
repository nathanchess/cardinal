"""Derive a qualitative USER_PERSONA spend profile from annual category totals.

Tiers intentionally match the only three values `taxonomy.reward_intensity()`
can ever produce on the card side (base/medium/high) -- introducing a fourth
tier here would mean user personas could emit a token no card embedding can
ever contain, breaking the shared-vocabulary alignment the taxonomy exists for.
"""

from __future__ import annotations

HIGH_SHARE = 0.15
MEDIUM_SHARE = 0.06
BASE_SHARE = 0.01


def spend_profile_from_totals(category_totals: dict[str, float]) -> dict[str, str]:
    total = sum(category_totals.values())
    if total <= 0:
        return {}

    profile: dict[str, str] = {}
    for category, amount in category_totals.items():
        share = amount / total
        if share >= HIGH_SHARE:
            profile[category] = "high"
        elif share >= MEDIUM_SHARE:
            profile[category] = "medium"
        elif share >= BASE_SHARE:
            profile[category] = "base"
    return profile
