from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.mental_agent import breathing_exercise, journal_prompt
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()


class BreathingRequest(BaseModel):
    minutes: int = 2


@router.post("/mental/breathing")
def mental_breathing(req: BreathingRequest):
    res = breathing_exercise(req.minutes)
    return {"disclaimer": DISCLAIMER, "title": res.title, "actions": res.actions}


@router.get("/mental/journal-prompt")
def mental_journal_prompt():
    res = journal_prompt()
    return {"disclaimer": DISCLAIMER, "title": res.title, "actions": res.actions}
