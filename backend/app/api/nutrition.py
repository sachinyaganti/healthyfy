from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.nutrition_agent import build_meal_plan
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()


class NutritionRequest(BaseModel):
    preference: str = "balanced"
    allergies: str = ""


@router.post("/nutrition/plan")
def nutrition_plan(req: NutritionRequest):
    res = build_meal_plan(req.preference, req.allergies)
    return {"disclaimer": DISCLAIMER, "title": res.title, "meal_plan": res.meal_plan, "tips": res.tips}
