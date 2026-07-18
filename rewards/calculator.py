"""Compute a card's projected annual reward value given category spend totals.

Known limitation: each taxonomy category is capped against its own matched
earn_rate independently. Real issuer caps that pool multiple taxonomy
categories under one bonus line (e.g. "streaming + online grocery") are not
modeled as a combined cap here -- not worth the complexity for a demo.

Benefits and earn rates are both priced as best-case projections: a benefit
counts at full face value once its cadence and any enrollment/activation
friction are applied (no attempt to model whether this specific user would
actually redeem it -- kNN retrieval already narrows to a semantically
plausible candidate set, and the dollar breakdown is meant to be reviewed by
the user, not to itself guess at redemption likelihood). Earn rates gated
behind a portal/booking requirement (e.g. "booked through Citi Travel") are
similarly assumed fully achievable. The one exception is rotating/flexible
categories (e.g. "quarterly rotating categories"): real programs only
activate one such category at a time, so applying the bonus rate to every
FLEXIBLE_TARGETS category simultaneously would fabricate money that cannot
exist even in the best case -- that case is restricted to the user's single
highest-spend eligible category instead.
"""

from __future__ import annotations

from preprocess.taxonomy import (
    BENEFIT_CATEGORY,
    BENEFIT_TOKENS,
    FLEXIBLE_CATEGORY_MARKERS,
    FLEXIBLE_TARGETS,
    map_categories,
    match_tokens,
)

CAP_PERIOD_ANNUAL_MULTIPLIER = {
    "calendar year": 1,
    "account anniversary year": 1,
    "quarter": 4,
    "billing cycle": 12,
}

DEFAULT_CPP_BY_CURRENCY = {"points": 1.0, "miles": 1.3}
DEFAULT_CPP_FALLBACK = 1.0

# value_usd is already the annualized total for these cadences (verified
# against issuer terms) -- only "every four years" needs discounting to a
# per-year share. frequency: null is genuinely unknown cadence -> excluded.
FREQUENCY_ANNUAL_MULTIPLIER = {
    "annual": 1.0,
    "monthly": 1.0,
    "quarterly": 1.0,
    "semiannual": 1.0,
    "every four years": 0.25,
}

FRICTION_DISCOUNT = 0.85


def _flexible_target_categories(category_totals: dict[str, float]) -> list[str]:
    """Only one rotating/flexible category can realistically be "on" at once.

    Best-case assumption: it's whichever FLEXIBLE_TARGETS category the user
    spends the most in. If the user has no spend in any of them, the bonus
    has nothing to attach to.
    """
    eligible = [category for category in FLEXIBLE_TARGETS if category_totals.get(category, 0) > 0]
    if not eligible:
        return []
    return [max(eligible, key=lambda category: category_totals[category])]


def _earn_rates_by_taxonomy_category(
    card: dict, category_totals: dict[str, float]
) -> dict[str, list[dict]]:
    profile: dict[str, list[dict]] = {}
    for earn_rate in card["earn_rates"]:
        label = earn_rate["category"].lower()
        categories = (
            _flexible_target_categories(category_totals)
            if any(marker in label for marker in FLEXIBLE_CATEGORY_MARKERS)
            else map_categories(label)
        )
        for category in categories:
            profile.setdefault(category, []).append(earn_rate)
    return profile


def _base_rate(card: dict) -> dict:
    for earn_rate in card["earn_rates"]:
        if "all other" in earn_rate["category"].lower():
            return earn_rate
    uncapped = [er for er in card["earn_rates"] if not er.get("spend_cap_usd")]
    return min(uncapped or card["earn_rates"], key=lambda er: er["rate"])


def _resolve_cpp(card: dict) -> float:
    cpp = card.get("point_value_estimate_cpp")
    if cpp is not None:
        return cpp
    return DEFAULT_CPP_BY_CURRENCY.get(card.get("reward_currency"), DEFAULT_CPP_FALLBACK)


def _rate_to_dollars(spend: float, rate: float, unit: str, cpp: float) -> float:
    if unit == "percent_cashback":
        return spend * (rate / 100)
    return spend * rate * (cpp / 100)


def _annual_cap(earn_rate: dict) -> float | None:
    cap = earn_rate.get("spend_cap_usd")
    if not cap:
        return None
    multiplier = CAP_PERIOD_ANNUAL_MULTIPLIER.get(earn_rate.get("cap_period"), 1)
    return cap * multiplier


def _value_for_earn_rate(
    spend: float, earn_rate: dict, base_rate: dict, cpp: float
) -> tuple[float, bool]:
    annual_cap = _annual_cap(earn_rate)
    if annual_cap is None:
        return _rate_to_dollars(spend, earn_rate["rate"], earn_rate["unit"], cpp), False

    eligible = min(spend, annual_cap)
    overflow = max(spend - annual_cap, 0.0)
    value = _rate_to_dollars(eligible, earn_rate["rate"], earn_rate["unit"], cpp)
    value += _rate_to_dollars(overflow, base_rate["rate"], base_rate["unit"], cpp)
    return value, True


def _benefit_category(benefit: dict) -> str | None:
    """Informational only (shown in the breakdown) -- does not affect pricing."""
    text = f"{benefit.get('name') or ''} {benefit.get('conditions') or ''}"
    for token in match_tokens(text, BENEFIT_TOKENS):
        category = BENEFIT_CATEGORY.get(token)
        if category is not None:
            return category
    return None


def _priced_benefit(benefit: dict) -> dict | None:
    frequency_multiplier = FREQUENCY_ANNUAL_MULTIPLIER.get(benefit.get("frequency"))
    if frequency_multiplier is None:
        return None

    friction_multiplier = (
        FRICTION_DISCOUNT
        if benefit.get("enrollment_required") or benefit.get("requires_activation")
        else 1.0
    )
    value_usd = benefit["value_usd"]
    priced_value = value_usd * frequency_multiplier * friction_multiplier

    return {
        "name": benefit["name"],
        "category": _benefit_category(benefit),
        "value_usd": value_usd,
        "frequency_multiplier": frequency_multiplier,
        "friction_multiplier": friction_multiplier,
        "priced_value_usd": round(priced_value, 2),
    }


def _price_benefits(card: dict) -> tuple[float, list[dict]]:
    priced = [
        result
        for benefit in card.get("credits_and_benefits", [])
        if (result := _priced_benefit(benefit)) is not None
    ]
    total = sum(item["priced_value_usd"] for item in priced)
    return round(total, 2), priced


def calculate_card_value(card_metadata: dict, category_totals: dict[str, float]) -> dict:
    card = card_metadata
    cpp = _resolve_cpp(card)
    base_rate = _base_rate(card)
    rates_by_category = _earn_rates_by_taxonomy_category(card, category_totals)

    by_category = {}
    total_reward_value = 0.0
    for category, spend in category_totals.items():
        candidates = rates_by_category.get(category, [])
        best_earn_rate, best_value, best_capped = None, -1.0, False
        for earn_rate in candidates:
            value, capped = _value_for_earn_rate(spend, earn_rate, base_rate, cpp)
            if value > best_value:
                best_earn_rate, best_value, best_capped = earn_rate, value, capped

        if best_earn_rate is not None:
            matched_label = best_earn_rate["category"]
            rate, unit = best_earn_rate["rate"], best_earn_rate["unit"]
            reward_value, capped = round(best_value, 2), best_capped
        else:
            matched_label = None
            rate, unit = base_rate["rate"], base_rate["unit"]
            reward_value = round(_rate_to_dollars(spend, rate, unit, cpp), 2)
            capped = False

        by_category[category] = {
            "spend_usd": round(spend, 2),
            "matched_label": matched_label,
            "rate": rate,
            "unit": unit,
            "capped": capped,
            "reward_value_usd": reward_value,
        }
        total_reward_value += reward_value

    benefits_value, priced_benefits = _price_benefits(card)
    total_reward_value += benefits_value

    annual_fee = card["annual_fee_usd"]
    return {
        "card_id": card["id"],
        "annual_fee_usd": annual_fee,
        "total_reward_value_usd": round(total_reward_value, 2),
        "net_annual_value_usd": round(total_reward_value - annual_fee, 2),
        "by_category": by_category,
        "priced_benefits": priced_benefits,
    }
