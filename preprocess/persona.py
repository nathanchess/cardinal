"""Render parallel CARD_PERSONA and USER_PERSONA embedding strings."""

from __future__ import annotations

from preprocess.taxonomy import (
    BENEFIT_TOKENS,
    CATEGORIES,
    CHANNEL_TOKENS,
    FLEXIBLE_CATEGORY_MARKERS,
    LIFESTYLE_TAGS,
    PROGRAM_TOKENS,
    fee_tier,
    map_categories,
    match_tokens,
    reward_intensity,
    stronger,
)


def _has_flexible_earn(card: dict) -> bool:
    return any(
        any(marker in earn_rate["category"].lower() for marker in FLEXIBLE_CATEGORY_MARKERS)
        for earn_rate in card["earn_rates"]
    )


def card_category_profile(card: dict) -> dict[str, str]:
    """Category strengths for embedding recall.

    Rotating/flexible bonus lines are intentionally not expanded onto every
    FLEXIBLE_TARGETS category here (that inflated Discover/Freedom Flex into
    "good at everything"). Flexible behavior is signaled via reward_style
    instead; the rewards calculator still expands those lines for dollar math.
    """
    profile: dict[str, str] = {}
    for earn_rate in card["earn_rates"]:
        intensity = reward_intensity(float(earn_rate["rate"]), earn_rate["unit"])
        label = earn_rate["category"].lower()
        if any(marker in label for marker in FLEXIBLE_CATEGORY_MARKERS):
            continue
        for category in map_categories(label):
            profile[category] = stronger(profile.get(category, "base"), intensity)
    return profile


def card_reward_styles(card: dict) -> list[str]:
    currency = (card.get("reward_currency") or "").lower()
    program = (card.get("rewards_program") or "").lower()
    units = {earn_rate["unit"] for earn_rate in card["earn_rates"]}
    styles: list[str] = []
    if card["transfer_partners"]:
        styles.append("transferable_points")
    if (
        "percent_cashback" in units
        or "cash" in currency
        or "reward dollar" in currency
    ):
        styles.append("cashback")
    if any(token in program for token in ("hilton", "marriott", "hyatt", "ihg", "choice")):
        styles.append("hotel_points")
    if any(
        token in program
        for token in (
            "united",
            "southwest",
            "delta",
            "aadvantage",
            "aeroplan",
            "atmos",
            "mileage",
        )
    ) or currency == "miles":
        styles.append("airline_miles")
    if _has_flexible_earn(card):
        styles.append("flexible_categories")
    if not styles and currency in {"points", "reward dollars"}:
        styles.append("fixed_value_points")
    if not styles and not currency:
        styles.append("no_rewards")
    return list(dict.fromkeys(styles)) or ["fixed_value_points"]


def card_goals(card: dict, profile: dict[str, str], styles: list[str]) -> list[str]:
    goals: list[str] = []
    travel_core = any(
        profile.get(category) in {"medium", "high"}
        for category in ("travel_flights", "travel_hotels")
    )
    if (
        "transferable_points" in styles
        or "airline_miles" in styles
        or "hotel_points" in styles
        or travel_core
    ):
        goals.append("travel_redemption")
    if "airline_miles" in styles:
        goals.append("airline_loyalty")
    if "hotel_points" in styles:
        goals.append("hotel_loyalty")
    if "cashback" in styles and "transferable_points" not in styles:
        goals.append("simple_cashback")
    strong_non_general = [
        intensity
        for category, intensity in profile.items()
        if category != "general" and intensity in {"medium", "high"}
    ]
    if (
        "flexible_categories" in styles
        or any(intensity == "high" for intensity in strong_non_general)
        or len(strong_non_general) >= 2
    ):
        goals.append("maximize_rewards")
    if card["annual_fee_usd"] == 0:
        goals.append("minimize_fees")
    if card["annual_fee_usd"] >= 500:
        goals.append("premium_benefits")
    if card.get("audience") == "small_business":
        goals.append("business_rewards")
    return list(dict.fromkeys(goals)) or ["maximize_rewards"]

def card_booking_channels(card: dict) -> list[str]:
    text = " ".join(
        str(earn_rate.get("portal_or_booking_requirement") or "")
        for earn_rate in card["earn_rates"]
    )
    return match_tokens(text, CHANNEL_TOKENS)


def card_loyalty_programs(card: dict) -> list[str]:
    text = " ".join(
        str(card.get(field) or "")
        for field in ("rewards_program", "card_family", "name")
    )
    return match_tokens(text, PROGRAM_TOKENS)


def card_benefits(card: dict) -> list[str]:
    text = " ".join(
        [
            *(
                (benefit.get("name") or "") + " " + (benefit.get("conditions") or "")
                for benefit in card["credits_and_benefits"]
            ),
            *card["travel_features"],
            *card["protections"],
        ]
    )
    return match_tokens(text, BENEFIT_TOKENS)


def category_line(profile: dict[str, str]) -> str:
    return "; ".join(
        f"{category}={profile[category]}"
        for category in CATEGORIES
        if category in profile
    )


def join_values(values: list[str]) -> str:
    return " | ".join(values)


def render_card_persona(card: dict) -> str:
    profile = card_category_profile(card)
    styles = card_reward_styles(card)
    goals = card_goals(card, profile, styles)
    channels = card_booking_channels(card)
    programs = card_loyalty_programs(card)
    benefits = card_benefits(card)
    lifestyle = [
        tag
        for category, tag in LIFESTYLE_TAGS.items()
        if profile.get(category) in {"medium", "high"}
    ]
    if card.get("audience") == "small_business":
        lifestyle.append("business_owner")
    if "flexible_categories" in styles:
        lifestyle.append("category_optimizer")
    strongest = [
        category
        for category, intensity in profile.items()
        if intensity in {"medium", "high"}
    ]

    lines = [
        "CARD_PERSONA",
        f"audience: {card.get('audience') or 'consumer'}",
        f"primary_goals: {join_values(goals)}",
        f"reward_style: {join_values(styles)}",
        f"fee_tier: {fee_tier(card['annual_fee_usd'])}",
        f"category_profile: {category_line(profile)}",
    ]
    if card["foreign_transaction_fee_pct"] == 0:
        lines.append("foreign_transaction_fees: waived")
    if channels:
        lines.append(f"booking_channels: {join_values(channels)}")
    if programs:
        lines.append(f"loyalty_programs: {join_values(programs)}")
    if benefits:
        lines.append(f"benefit_profile: {join_values(benefits)}")
    if lifestyle:
        lines.append(f"lifestyle_tags: {join_values(lifestyle)}")
    if strongest:
        summary = "Best for " + ", ".join(strongest) + "."
    elif "flexible_categories" in styles:
        summary = "Best for rotating or selectable bonus categories."
    else:
        summary = "Best for general everyday spending."
    lines.append(f"summary: {summary}")
    return "\n".join(lines)

def render_user_persona(profile: dict) -> str:
    category_profile = {
        category: "base" if intensity == "low" else intensity
        for category, intensity in profile["spend_profile"].items()
        if intensity != "none"
    }
    lines = [
        "USER_PERSONA",
        f"audience: {profile.get('audience', 'consumer')}",
        f"primary_goals: {join_values(profile['primary_goals'])}",
        f"reward_style: {join_values(profile['reward_style'])}",
        f"fee_tier: {profile['fee_tier']}",
        f"category_profile: {category_line(category_profile)}",
    ]
    if profile.get("foreign_transaction_fees") == "waived":
        lines.append("foreign_transaction_fees: waived")
    if profile.get("booking_channels"):
        lines.append(f"booking_channels: {join_values(profile['booking_channels'])}")
    if profile.get("loyalty_programs"):
        lines.append(f"loyalty_programs: {join_values(profile['loyalty_programs'])}")
    if profile.get("benefit_profile"):
        lines.append(f"benefit_profile: {join_values(profile['benefit_profile'])}")
    if profile.get("lifestyle_tags"):
        lines.append(f"lifestyle_tags: {join_values(profile['lifestyle_tags'])}")
    lines.append(f"summary: {profile['summary'].strip()}")
    return "\n".join(lines)
