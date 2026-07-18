"""Shared vocabulary for card and user persona embeddings."""

from __future__ import annotations

CATEGORIES = (
    "dining",
    "groceries",
    "gas",
    "transit",
    "travel_flights",
    "travel_hotels",
    "travel_other",
    "streaming",
    "drugstores",
    "online_shopping",
    "wholesale_clubs",
    "utilities",
    "entertainment",
    "general",
)

CATEGORY_RULES = (
    (("wholesale",), "wholesale_clubs"),
    (("drugstore", "pharmacy"), "drugstores"),
    (("streaming",), "streaming"),
    (("online retail", "online shopping"), "online_shopping"),
    (("supermarket", "grocery", "grocer"), "groceries"),
    (("dining", "restaurant", "takeout", "food delivery"), "dining"),
    (("gas station", "ev charging", "electric vehicle"), "gas"),
    (("transit", "commuting", "rideshare"), "transit"),
    (
        (
            "flight",
            "airline",
            "air travel",
            "air canada",
            "delta purchase",
            "united purchase",
            "southwest purchase",
            "alaska airline",
        ),
        "travel_flights",
    ),
    (
        ("hotel", "marriott", "hilton", "hyatt", "ihg", "vacation rental"),
        "travel_hotels",
    ),
    (("rental car", "car rental", "cruise", "travel"), "travel_other"),
    (
        ("entertainment", "fitness", "gym", "recreation", "self-care"),
        "entertainment",
    ),
    (
        ("utility", "phone plan", "internet", "cable", "shipping", "advertising"),
        "utilities",
    ),
    (("rent payment", "all other", "eligible purchase"), "general"),
)

FLEXIBLE_CATEGORY_MARKERS = (
    "highest eligible",
    "rotating",
    "selected everyday",
    "selected choice",
    "selected category",
    "two selected",
    "two eligible",
)

FLEXIBLE_TARGETS = (
    "dining",
    "groceries",
    "gas",
    "transit",
    "streaming",
    "drugstores",
    "online_shopping",
)

INTENSITY_ORDER = {"base": 0, "medium": 1, "high": 2, "dominant": 3}

PROGRAM_TOKENS = (
    ("ultimate rewards", "ultimate_rewards"),
    ("membership rewards", "membership_rewards"),
    ("capital one miles", "capital_one_miles"),
    ("thankyou", "thankyou_rewards"),
    ("wells fargo", "wells_fargo_rewards"),
    ("bilt", "bilt_rewards"),
    ("united", "united_mileageplus"),
    ("southwest", "southwest_rapid_rewards"),
    ("aeroplan", "aeroplan"),
    ("delta", "delta_skymiles"),
    ("aadvantage", "american_aadvantage"),
    ("atmos", "atmosphere_rewards"),
    ("marriott", "marriott_bonvoy"),
    ("hyatt", "world_of_hyatt"),
    ("ihg", "ihg_one_rewards"),
    ("hilton", "hilton_honors"),
    ("choice", "choice_privileges"),
    ("altitude", "altitude_rewards"),
    ("premium rewards", "premium_rewards"),
    ("discover", "discover_cashback"),
)

CHANNEL_TOKENS = (
    ("chase travel", "chase_travel"),
    ("american express travel", "amex_travel"),
    ("capital one travel", "capital_one_travel"),
    ("citi travel", "citi_travel"),
    ("booked directly with airlines", "direct_airline"),
    ("purchased directly from delta", "airline_cobrand"),
    ("purchased from united", "airline_cobrand"),
    ("purchased from southwest", "airline_cobrand"),
    ("purchased from american", "airline_cobrand"),
    ("alaska", "airline_cobrand"),
    ("air canada", "airline_cobrand"),
    ("booked directly with hotels", "direct_hotel"),
    ("hilton", "hotel_cobrand"),
    ("marriott", "hotel_cobrand"),
    ("hyatt", "hotel_cobrand"),
    ("ihg", "hotel_cobrand"),
    ("choice", "hotel_cobrand"),
)

BENEFIT_TOKENS = (
    ("hotel credit", "hotel_credit"),
    ("travel credit", "travel_credit"),
    ("dining credit", "dining_credit"),
    ("resy", "dining_credit"),
    ("uber", "rideshare_credit"),
    ("global entry", "global_entry_credit"),
    ("tsa precheck", "tsa_precheck_credit"),
    ("lounge", "lounge_access"),
    ("checked bag", "checked_bag"),
    ("priority boarding", "priority_boarding"),
    ("companion", "companion_pass"),
    ("free night", "free_night"),
    ("hotel status", "hotel_status"),
    ("trip cancellation", "trip_protection"),
    ("trip delay", "trip_protection"),
    ("trip interruption", "trip_protection"),
    ("purchase protection", "purchase_protection"),
    ("extended warranty", "warranty_protection"),
    ("cell phone", "cell_phone_protection"),
    ("rental", "rental_car_protection"),
)

BENEFIT_CATEGORY = {
    "hotel_credit": "travel_hotels",
    "travel_credit": "travel_other",
    "dining_credit": "dining",
    "rideshare_credit": "transit",
    "global_entry_credit": "travel_flights",
    "tsa_precheck_credit": "travel_flights",
    "lounge_access": "travel_flights",
    "checked_bag": "travel_flights",
    "priority_boarding": "travel_flights",
    "companion_pass": "travel_flights",
    "free_night": "travel_hotels",
    "hotel_status": "travel_hotels",
    "trip_protection": "travel_other",
    "purchase_protection": "general",
    "warranty_protection": "general",
    "cell_phone_protection": "utilities",
    "rental_car_protection": "travel_other",
}

LIFESTYLE_TAGS = {
    "dining": "diner",
    "groceries": "grocery_shopper",
    "gas": "driver",
    "transit": "commuter",
    "travel_flights": "flyer",
    "travel_hotels": "hotel_traveler",
    "travel_other": "general_traveler",
    "streaming": "streamer",
    "online_shopping": "online_shopper",
}


def map_categories(label: str) -> list[str]:
    text = label.lower()
    categories = [
        category
        for keywords, category in CATEGORY_RULES
        if any(keyword in text for keyword in keywords)
    ]
    return categories or ["general"]


def reward_intensity(rate: float, unit: str) -> str:
    high_threshold = 3.0 if unit == "percent_cashback" else 4.0
    if rate >= high_threshold:
        return "high"
    if rate >= 2.0:
        return "medium"
    return "base"


def stronger(left: str, right: str) -> str:
    return left if INTENSITY_ORDER[left] >= INTENSITY_ORDER[right] else right


def fee_tier(annual_fee_usd: float) -> str:
    if annual_fee_usd == 0:
        return "zero"
    if annual_fee_usd < 100:
        return "low"
    if annual_fee_usd < 300:
        return "mid"
    if annual_fee_usd < 500:
        return "high"
    return "premium"


def match_tokens(text: str, rules: tuple[tuple[str, str], ...]) -> list[str]:
    lowered = text.lower()
    return list(
        dict.fromkeys(token for needle, token in rules if needle in lowered)
    )
