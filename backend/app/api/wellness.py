from __future__ import annotations

import os
from fastapi import APIRouter
from pydantic import BaseModel

from app.rules.safety_guardrails import DISCLAIMER
from app.vector.store import FaissVectorStore

router = APIRouter()


class RetrieveRequest(BaseModel):
    query: str
    k: int = 4


@router.post("/wellness/retrieve")
def retrieve(req: RetrieveRequest):
    store = FaissVectorStore(data_dir=os.getenv("VECTOR_DATA_DIR", "./data"))
    chunks = store.search(req.query, k=req.k)
    return {
        "disclaimer": DISCLAIMER,
        "results": [{"id": c.id, "text": c.text, "meta": c.meta} for c in chunks],
    }
