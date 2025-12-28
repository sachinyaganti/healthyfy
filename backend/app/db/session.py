from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    pass


def _build_db_url() -> str:
    # MySQL (default). Override via DATABASE_URL.
    # Example: mysql+pymysql://healthyfy:healthyfy@localhost:3306/healthyfy
    return os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://healthyfy:healthyfy@localhost:3306/healthyfy",
    )


engine = create_engine(_build_db_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
