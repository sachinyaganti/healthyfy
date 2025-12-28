from __future__ import annotations

from dataclasses import dataclass


@dataclass
class NutritionResult:
    title: str
    meal_plan: list[str]
    tips: list[str]


def build_meal_plan(preference: str, allergies_text: str = "") -> NutritionResult:
    pref = (preference or "balanced").lower()
    allergies = (allergies_text or "").strip()

    base = [
        "Breakfast: Greek yogurt + fruit + nuts (or plant yogurt + seeds).",
        "Lunch: Bowl—whole grains + protein + colorful veg + olive-oil dressing.",
        "Snack: Fruit + roasted chana / hummus + veggies.",
        "Dinner: Protein + 2 veggies + a carb portion (rice/roti/potato).",
    ]

    if pref == "vegetarian":
        base[1] = "Lunch: Dal/rajma/chole + brown rice/roti + salad."
        base[3] = "Dinner: Paneer/tofu + veggies stir-fry + roti/rice."
    elif pref == "vegan":
        base[0] = "Breakfast: Oats + soy milk + banana + peanut butter."
        base[3] = "Dinner: Tofu/soy chunks + veggies + quinoa/rice."
    elif pref in {"high-protein", "high protein"}:
        base[0] = "Breakfast: Eggs/tofu scramble + fruit."
        base[3] = "Dinner: Chicken/fish/tofu + veggies + small carb portion."

    tips = [
        "Aim for protein + fiber at each meal to stay fuller longer.",
        "Hydration: keep a water bottle visible; sip through the day.",
        "80/20 approach: consistent basics, flexible treats.",
    ]
    if allergies:
        tips.insert(0, f"Allergy note: avoid {allergies}. Double-check labels when eating out.")

    return NutritionResult(title="Nutrition Planning", meal_plan=base, tips=tips)
