from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.fitness_agent import build_fitness_plan
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()


class FitnessRequest(BaseModel):
    goal: str = "general fitness"
    level: str = "beginner"


@router.post("/fitness/plan")
def fitness_plan(req: FitnessRequest):
    res = build_fitness_plan(req.goal, req.level)
    return {"disclaimer": DISCLAIMER, "title": res.title, "plan": res.plan, "youtube_links": res.youtube_links}
