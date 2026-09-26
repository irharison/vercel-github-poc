"""SQLite engine. The path is read when a connection is opened so tests can isolate databases.

On Vercel the filesystem is read-only except /tmp, and /tmp belongs to one function
instance. The book is a SQLite file there: seeded on cold start, visible to later
requests on that same instance, and gone when the instance is. It is not shared
across instances. sqlite:///:memory: uses one shared connection. A pooled memory
database would give each request an empty database and the next request would fail.
"""

from __future__ import annotations

import os
import threading
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = ROOT / "data" / "fathom.db"
VERCEL_DB = Path("/tmp/fathom.db")

_engine = None
_engine_url: str | None = None
_Session: sessionmaker | None = None
_ready = False
_ready_lock = threading.Lock()


class Base(DeclarativeBase):
    pass


def _memory_url(url: str) -> bool:
    return url in {"sqlite://", "sqlite:///:memory:"} or url.endswith("/:memory:")


def database_url() -> str:
    override = os.environ.get("FATHOM_DATABASE_URL")
    if override:
        return override
    if os.environ.get("VERCEL"):
        return f"sqlite:///{VERCEL_DB}"
    path = Path(os.environ.get("FATHOM_DB", str(DEFAULT_DB)))
    path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{path}"


def get_engine():
    global _engine, _engine_url, _Session
    url = database_url()
    if _engine is None or url != _engine_url:
        if _engine is not None:
            _engine.dispose()
        kwargs: dict = {"connect_args": {"check_same_thread": False, "timeout": 30}, "future": True}
        if _memory_url(url):
            kwargs["poolclass"] = StaticPool
        engine = create_engine(url, **kwargs)
        if not _memory_url(url):

            @event.listens_for(engine, "connect")
            def _sqlite_pragmas(dbapi_connection, _connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA busy_timeout=5000")
                cursor.close()

        _engine = engine
        _engine_url = url
        _Session = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)
    return _engine


def reset_engine() -> None:
    global _engine, _engine_url, _Session, _ready
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _engine_url = None
    _Session = None
    _ready = False


def session_local() -> Session:
    get_engine()
    assert _Session is not None
    return _Session()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(get_engine())


def ensure_ready() -> None:
    """Create tables and seed an empty book. Safe to call from every request."""
    global _ready
    if _ready:
        return
    with _ready_lock:
        if _ready:
            return
        init_db()
        from app.models import Book
        from app.seed import seed

        db = session_local()
        try:
            if db.query(Book).count() == 0:
                seed(db)
        finally:
            db.close()
        _ready = True


def get_db() -> Generator[Session, None, None]:
    ensure_ready()
    db = session_local()
    try:
        yield db
    finally:
        db.close()
