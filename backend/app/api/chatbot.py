from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.orchestrator import AgentOrchestrator
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()
orch = AgentOrchestrator()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    user_context: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply: str
    domain: str
    disclaimer: str = DISCLAIMER
    tool_payload: dict | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    result = await orch.handle(req.message, req.user_context)
    return ChatResponse(reply=result.reply, domain=result.domain, tool_payload=result.tool_payload)
