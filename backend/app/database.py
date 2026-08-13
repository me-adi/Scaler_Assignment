"""Engine, session, and declarative base for the SQLite database.

The database file lives at `backend/app.db` by default (DATABASE_PATH
unset). In production (see backend/render.yaml), DATABASE_PATH points at a
Render persistent disk instead — a platform's default ephemeral filesystem
would otherwise lose the SQLite file on every redeploy/restart. See
README's Deployment section.
"""

import os
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_PATH = os.environ.get("DATABASE_PATH", "./app.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    # SQLite + FastAPI: connections are shared across threadpool workers.
    connect_args={"check_same_thread": False},
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
