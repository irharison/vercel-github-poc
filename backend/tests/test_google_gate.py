"""The umbrella Google session is required before classroom Basic auth."""

import base64
import json
import os
import subprocess
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db import reset_engine
from app.gate import decode_session_token, dev_bypass_active, is_allowed_email
from app.main import create_app

REPO = Path(__file__).resolve().parents[2]
SECRET = "test-secret-value"


def _encode(email: str, salt: str) -> str:
    script = """
import { encode } from "@auth/core/jwt";
const token = await encode({
  token: { email: process.env.EMAIL, sub: "gate-test" },
  secret: process.env.SECRET,
  salt: process.env.SALT,
  maxAge: 3600,
});
process.stdout.write(token);
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=REPO,
        env={**os.environ, "EMAIL": email, "SECRET": SECRET, "SALT": salt},
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


@pytest.fixture()
def gated(tmp_path, monkeypatch):
    monkeypatch.setenv("FATHOM_DB", str(tmp_path / "gate.db"))
    monkeypatch.delenv("AUTH_DEV_BYPASS", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.setenv("NODE_ENV", "test")
    monkeypatch.setenv("AUTH_SECRET", SECRET)
    reset_engine()
    with TestClient(create_app(enforce_google=True)) as client:
        yield client
    reset_engine()


def test_allowed_email_matches_the_umbrella_rule():
    assert is_allowed_email("ian@nataliedennis.co.uk")
    assert is_allowed_email("Ian@NatalieDennis.CO.UK")
    assert not is_allowed_email("ian@gmail.com")
    assert not is_allowed_email("ian@sub.nataliedennis.co.uk")
    assert not is_allowed_email("ian@nataliedennis.co.uk.evil.com")
    assert not is_allowed_email(None)


def test_dev_bypass_cannot_run_on_vercel(monkeypatch):
    monkeypatch.setenv("AUTH_DEV_BYPASS", "1")
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("VERCEL", "1")
    assert dev_bypass_active() is False
    monkeypatch.delenv("VERCEL")
    assert dev_bypass_active() is True
    monkeypatch.setenv("NODE_ENV", "production")
    assert dev_bypass_active() is False


def test_ping_requires_google_session(gated: TestClient):
    denied = gated.get("/fathom/Monitoring/Ping")
    assert denied.status_code == 401
    assert denied.json() == {"error": "Unauthorized"}
    assert "www-authenticate" not in {k.lower() for k in denied.headers}


def test_docs_navigation_redirects_to_sign_in(gated: TestClient):
    response = gated.get("/fathom/docs", headers={"accept": "text/html"}, follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"].startswith("/signin?callbackUrl=")
    assert "fathom" in response.headers["location"]


def test_vercel_ignores_bypass(tmp_path, monkeypatch):
    monkeypatch.setenv("FATHOM_DB", str(tmp_path / "vercel.db"))
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("AUTH_DEV_BYPASS", "1")
    monkeypatch.delenv("AUTH_SECRET", raising=False)
    reset_engine()
    with TestClient(create_app(enforce_google=True)) as client:
        assert client.get("/fathom/Monitoring/Ping").status_code == 401
    reset_engine()


def test_bypass_allows_ping_then_basic_still_guards_trades(tmp_path, monkeypatch):
    monkeypatch.setenv("FATHOM_DB", str(tmp_path / "bypass.db"))
    monkeypatch.delenv("VERCEL", raising=False)
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("AUTH_DEV_BYPASS", "1")
    reset_engine()
    with TestClient(create_app(enforce_google=True)) as client:
        assert client.get("/fathom/Monitoring/Ping").status_code == 200
        denied = client.get("/fathom/api/Trades")
        assert denied.status_code == 401
        token = base64.b64encode(b"desk:fathom").decode()
        allowed = client.get("/fathom/api/Trades", headers={"Authorization": f"Basic {token}"})
        assert allowed.status_code == 200
        assert allowed.json()["Count"] >= 15
    reset_engine()


def _cookie(name: str, value: str) -> dict[str, str]:
    return {"cookie": f"{name}={value}"}


def test_authjs_cookie_opens_the_gate_and_basic_still_applies(gated: TestClient):
    auth_dir = REPO / "node_modules" / "@auth" / "core"
    if not auth_dir.exists():
        pytest.skip("next-auth is not installed")
    salt = "authjs.session-token"
    token = _encode("ian@nataliedennis.co.uk", salt)
    assert decode_session_token(token, SECRET, salt)["email"] == "ian@nataliedennis.co.uk"
    session = _cookie(salt, token)
    ping = gated.get("/fathom/Monitoring/Ping", headers=session)
    assert ping.status_code == 200
    denied = gated.get("/fathom/api/User/Login", headers=session)
    assert denied.status_code == 401
    basic = base64.b64encode(b"ops:fathom").decode()
    allowed = gated.get(
        "/fathom/api/User/Login",
        headers={**session, "Authorization": f"Basic {basic}"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["Username"] == "ops"


def test_secure_cookie_name_and_rejected_domain(gated: TestClient):
    auth_dir = REPO / "node_modules" / "@auth" / "core"
    if not auth_dir.exists():
        pytest.skip("next-auth is not installed")
    salt = "__Secure-authjs.session-token"
    good = _encode("ian@nataliedennis.co.uk", salt)
    spec = gated.get("/fathom/openapi.json", headers=_cookie(salt, good))
    assert spec.status_code == 200
    body = spec.json()
    assert "/fathom/api/Trades" in body["paths"]
    assert "/fathom/Monitoring/Ping" in body["paths"]

    bad = _encode("ian@gmail.com", salt)
    assert gated.get("/fathom/Monitoring/Ping", headers=_cookie(salt, bad)).status_code == 401


def test_chunked_cookie_and_garbage_token(gated: TestClient):
    auth_dir = REPO / "node_modules" / "@auth" / "core"
    if not auth_dir.exists():
        pytest.skip("next-auth is not installed")
    salt = "authjs.session-token"
    token = _encode("ian@nataliedennis.co.uk", salt)
    mid = len(token) // 2
    chunked = {"cookie": f"{salt}.0={token[:mid]}; {salt}.1={token[mid:]}"}
    assert gated.get("/fathom/Monitoring/Ping", headers=chunked).status_code == 200
    assert gated.get("/fathom/Monitoring/Ping", headers=_cookie(salt, "not-a-jwe")).status_code == 401
    assert json.loads('{"error":"Unauthorized"}')["error"] == "Unauthorized"
