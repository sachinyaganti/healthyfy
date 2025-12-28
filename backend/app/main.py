import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chatbot import router as chatbot_router
from app.api.fitness import router as fitness_router
from app.api.nutrition import router as nutrition_router
from app.api.mental import router as mental_router
from app.api.chronic import router as chronic_router
from app.api.wellness import router as wellness_router
from app.api.ml import router as ml_router
from app.api.coach import router as coach_router
from app.db.session import Base, engine
from app.vector.seed_docs import wellness_seed_documents
from app.vector.store import FaissVectorStore


def _parse_cors_origins(value: str | None) -> list[str]:
    if not value:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def create_app() -> FastAPI:
    app = FastAPI(
        title="Healthyfy API",
        version="0.1.0",
        description=(
            "Healthyfy provides non-medical wellness and lifestyle support. "
            "It does NOT diagnose, treat, or replace professional medical advice."
        ),
    )

    configured_origins = _parse_cors_origins(
        os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS")
    )
    default_dev_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    allow_origins = configured_origins or default_dev_origins

    # If you set CORS_ORIGINS="*", credentials must be disabled per CORS spec.
    allow_credentials = "*" not in allow_origins
    if "*" in allow_origins:
        allow_origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(chatbot_router, prefix="/api", tags=["chatbot"])
    app.include_router(fitness_router, prefix="/api", tags=["fitness"])
    app.include_router(nutrition_router, prefix="/api", tags=["nutrition"])
    app.include_router(mental_router, prefix="/api", tags=["mental"])
    app.include_router(chronic_router, prefix="/api", tags=["chronic"])
    app.include_router(wellness_router, prefix="/api", tags=["wellness"])
    app.include_router(ml_router, prefix="/api", tags=["ml"])
    app.include_router(coach_router, prefix="/api", tags=["coach"])

    return app


app = create_app()


log = logging.getLogger("healthyfy")


@app.on_event("startup")
def on_startup() -> None:
    # DB may not be available during import/local dev; attempt initialization on startup.
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        log.warning("DB init skipped (database unavailable): %s", exc)

    # Vector store is local and safe to initialize even if DB is down.
    try:
        store = FaissVectorStore(data_dir=os.getenv("VECTOR_DATA_DIR", "./data"))
        if store.index.ntotal == 0:
            store.add_documents(wellness_seed_documents())
    except Exception as exc:
        log.warning("Vector store init skipped: %s", exc)
