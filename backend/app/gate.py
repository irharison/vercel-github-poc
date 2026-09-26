"""Google session gate for the Fathom API.

Vercel service rewrites deliver /fathom/api, /fathom/docs, and /fathom/Monitoring
straight to this process. Next.js proxy.ts never sees those requests, so the
Auth.js cookie is checked here. Classroom HTTP Basic stays a second check on
the API routes themselves.

The cookie is the Auth.js v5 encrypted session (dir + A256CBC-HS512, HKDF
from AUTH_SECRET, salt = cookie name). Same rule as lib/auth-domain.ts:
the email must end with @nataliedennis.co.uk.
"""

from __future__ import annotations

import json
import os
import time
from urllib.parse import quote

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from joserfc import jwe
from joserfc.jwk import OctKey
from starlette.middleware.base import BaseHTTPMiddleware

# Must match ALLOWED_EMAIL_SUFFIX in lib/auth-domain.ts.
ALLOWED_EMAIL_SUFFIX = "@nataliedennis.co.uk"
SESSION_COOKIE_NAMES = (
    "__Secure-authjs.session-token",
    "authjs.session-token",
)
CLOCK_SKEW_SECONDS = 15


def is_allowed_email(email: object) -> bool:
    if not isinstance(email, str):
        return False
    normalised = email.strip().lower()
    at = normalised.rfind("@")
    if at <= 0:
        return False
    return normalised[at:] == ALLOWED_EMAIL_SUFFIX


def dev_bypass_active() -> bool:
    """Local next dev only. Ignored on Vercel and when NODE_ENV is not development."""
    if os.environ.get("VERCEL"):
        return False
    if os.environ.get("NODE_ENV") != "development":
        return False
    return os.environ.get("AUTH_DEV_BYPASS") == "1"


def google_gate_required() -> bool:
    """Production and local runs enforce the gate. The pytest suite opts out.

    FATHOM_TESTING is ignored when VERCEL is set, so the flag cannot open the
    API on a deployment.
    """
    if os.environ.get("VERCEL"):
        return True
    if os.environ.get("FATHOM_TESTING") == "1":
        return False
    return True


def _derive_key(secret: str, salt: str) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=64,
        salt=salt.encode(),
        info=f"Auth.js Generated Encryption Key ({salt})".encode(),
    ).derive(secret.encode())


def decode_session_token(token: str, secret: str, salt: str) -> dict | None:
    if not token or not secret:
        return None
    try:
        decrypted = jwe.decrypt_compact(token, OctKey.import_key(_derive_key(secret, salt)))
        payload = json.loads(decrypted.plaintext)
    except Exception:
        return None
    if not isinstance(payload, dict):
        return None
    exp = payload.get("exp")
    if not isinstance(exp, (int, float)):
        return None
    if time.time() > float(exp) + CLOCK_SKEW_SECONDS:
        return None
    return payload


def _cookie_value(cookies, name: str) -> str | None:
    direct = cookies.get(name)
    if direct:
        return direct
    parts: list[str] = []
    index = 0
    while True:
        chunk = cookies.get(f"{name}.{index}")
        if not chunk:
            break
        parts.append(chunk)
        index += 1
    if parts:
        return "".join(parts)
    return None


def session_email(cookies, secret: str | None) -> str | None:
    if not secret:
        return None
    for name in SESSION_COOKIE_NAMES:
        token = _cookie_value(cookies, name)
        if not token:
            continue
        payload = decode_session_token(token, secret, name)
        if payload is None:
            continue
        email = payload.get("email")
        if is_allowed_email(email):
            return str(email).strip().lower()
        return None
    return None


def _docs_navigation(path: str, method: str, accept: str) -> bool:
    if method != "GET" or "text/html" not in accept.lower():
        return False
    return path == "/fathom/docs" or path.startswith("/fathom/docs/") or path == "/fathom/redoc"


class GoogleSessionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if dev_bypass_active():
            return await call_next(request)
        email = session_email(request.cookies, os.environ.get("AUTH_SECRET"))
        if email:
            return await call_next(request)
        path = request.url.path
        if _docs_navigation(path, request.method, request.headers.get("accept", "")):
            target = path
            if request.url.query:
                target = f"{path}?{request.url.query}"
            return RedirectResponse(f"/signin?callbackUrl={quote(target)}", status_code=307)
        return JSONResponse({"error": "Unauthorized"}, status_code=401)


def install_google_gate(app: FastAPI) -> None:
    app.add_middleware(GoogleSessionMiddleware)
