"""Engine, session, and declarative base for the SQLite database.

The database file lives at `backend/app.db` by default (see CLAUDE.md).
Override via the DATABASE_URL env var in production — e.g. a Render
persistent disk path — since a platform's ephemeral local filesystem would
otherwise lose the SQLite file on every redeploy/restart. See README's
deployment checklist.
"""

import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# backend/app/database.py -> backend/
BASE_DIR = Path(__file__).resolve().parent.parent

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")

engine = create_engine(
    DATABASE_URL,
    # SQLite + FastAPI: connections are shared across threadpool workers.
    # Harmless no-op for a non-SQLite DATABASE_URL.
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
    """SQLite ignores FK constraints unless the pragma is set per connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Declarative base — all models in models.py inherit from this."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
