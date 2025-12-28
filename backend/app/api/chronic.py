from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.chronic_agent import chronic_lifestyle_support
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()


class ChronicRequest(BaseModel):
    condition: str = ""


@router.post("/chronic/support")
def chronic_support(req: ChronicRequest):
    res = chronic_lifestyle_support(req.condition)
    return {
        "disclaimer": DISCLAIMER,
        "title": res.title,
        "lifestyle_tips": res.lifestyle_tips,
        "community_stories": res.community_stories,
    }
