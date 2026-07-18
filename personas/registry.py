"""Sample personas for the mocked demo flow.

Moved out of main.py so both the CLI validator (main.py) and the API
(api/service.py) share one source of truth. `spend_profile` here is the
hand-authored fallback used only for fields render_user_persona needs beyond
spend_profile (primary_goals, fee_tier, lifestyle_tags, summary, ...) --
at request time the API overrides `spend_profile` with one computed from
this persona's sample transactions (see preprocess/persona_building.py).

Tier vocabulary is restricted to base/medium/high, matching the only values
taxonomy.reward_intensity() can ever produce on the card side -- "dominant"
is never emitted by any card and was previously a stray token here.
"""

from __future__ import annotations

PERSONAS = [
    {
        "id": "urban_diner",
        "label": "Urban diner / grocery heavy, mid fee OK",
        "current_card_id": "wells-fargo-active-cash",
        "profile": {
            "audience": "consumer",
            "primary_goals": ["maximize_rewards", "travel_redemption"],
            "reward_style": ["transferable_points"],
            # "high" under taxonomy.fee_tier()'s 5-tier scale ($300-$500) --
            # covers american-express-gold-card ($325), this persona's own
            # top expected match. "mid" ($100-$300) would exclude it.
            "fee_tier": "high",
            "spend_profile": {
                "dining": "high",
                "groceries": "high",
                "travel_flights": "medium",
                "streaming": "base",
                "general": "base",
            },
            "foreign_transaction_fees": "waived",
            "booking_channels": ["amex_travel", "direct_airline"],
            "loyalty_programs": ["membership_rewards"],
            "benefit_profile": ["dining_credit"],
            "lifestyle_tags": ["diner", "grocery_shopper", "flyer"],
            "summary": (
                "City professional who eats out constantly, shops groceries weekly, "
                "and will pay a mid annual fee for strong dining and grocery rewards."
            ),
        },
        "expect": [
            "american-express-gold-card",
            "chase-sapphire-preferred",
            "capital-one-savor-cash-rewards",
            "blue-cash-preferred-card-from-american-express",
        ],
    },
    {
        "id": "no_fee_cashback",
        "label": "Simple no-fee cashback, hates complexity",
        "current_card_id": "amex-everyday-preferred-credit-card",
        "profile": {
            "audience": "consumer",
            "primary_goals": ["minimize_fees", "simple_cashback"],
            "reward_style": ["cashback"],
            "fee_tier": "zero",
            "spend_profile": {
                "general": "high",
                "gas": "medium",
                "groceries": "medium",
                "dining": "base",
            },
            "lifestyle_tags": ["driver", "grocery_shopper"],
            "summary": (
                "Wants a free card with straightforward cash back and no portals, "
                "credits, or points strategy."
            ),
        },
        "expect": [
            "citi-double-cash",
            "wells-fargo-active-cash",
            "chase-freedom-unlimited",
            "capital-one-quicksilver-cash-rewards",
            "discover-it-cash-back",
        ],
    },
    {
        "id": "delta_premium_flyer",
        "label": "Frequent Delta flyer, premium fee OK",
        "current_card_id": "delta-skymiles-gold-american-express-card",
        "profile": {
            "audience": "consumer",
            "primary_goals": ["airline_loyalty", "travel_redemption", "premium_benefits"],
            "reward_style": ["airline_miles"],
            "fee_tier": "premium",
            "spend_profile": {
                "travel_flights": "high",
                "travel_hotels": "high",
                "dining": "medium",
                "general": "base",
            },
            "foreign_transaction_fees": "waived",
            "booking_channels": ["airline_cobrand", "direct_airline"],
            "loyalty_programs": ["delta_skymiles"],
            "benefit_profile": ["lounge_access", "checked_bag", "travel_credit"],
            "lifestyle_tags": ["flyer", "hotel_traveler", "diner"],
            "summary": (
                "Flies Delta often, books hotels regularly, and will pay a premium "
                "annual fee for lounge access and airline perks."
            ),
        },
        "expect": [
            "delta-skymiles-reserve-american-express-card",
            "delta-skymiles-platinum-american-express-card",
            "american-express-platinum-card",
            "capital-one-venture-x-rewards",
            "delta-skymiles-gold-american-express-card",
        ],
    },
]
