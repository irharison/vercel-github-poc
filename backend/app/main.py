"""Fathom Desk API.

Unofficial educational stand-in for a cross-asset front-to-back desk.
Public paths keep the vendor shape under /fathom: /fathom/api/Trades,
/fathom/Monitoring/Ping, /fathom/docs, /fathom/openapi.json.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import ensure_ready
from app.gate import google_gate_required, install_google_gate
from app.prefix import PUBLIC_PREFIX
from app.routes import api, monitoring


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_ready()
    yield


def create_app(*, enforce_google: bool | None = None) -> FastAPI:
    app = FastAPI(
        title="Fathom Desk API",
        version="1.0.0",
        description=(
            "Educational REST API whose resource names follow the public Orchestrade Web API "
            "subset reconstructed in Derivitec's Orchestrade.Client (HTTP Basic, /api/Trades, "
            "positions, pricing, risk analysis, reports, quotes, curves, parties). "
            "On this site every path is under /fathom, for example /fathom/api/Trades and "
            "/fathom/Monitoring/Ping. "
            "Classroom login: username desk or ops, password fathom. "
            "GET /fathom/Monitoring/Ping does not require the classroom login. "
            "The umbrella Google session is required for every path, including Ping, Swagger, and OpenAPI. "
            "Firms, books, and market levels are invented. This is not Orchestrade and not a production system."
        ),
        docs_url=f"{PUBLIC_PREFIX}/docs",
        redoc_url=f"{PUBLIC_PREFIX}/redoc",
        openapi_url=f"{PUBLIC_PREFIX}/openapi.json",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(monitoring)
    app.include_router(api)
    required = google_gate_required() if enforce_google is None else enforce_google
    if required:
        install_google_gate(app)
    return app


app = create_app()
