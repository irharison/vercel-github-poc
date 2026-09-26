"""The book is one database per process. A later request must see a booking."""

import base64
import os

from fastapi.testclient import TestClient


def _auth() -> dict[str, str]:
    token = base64.b64encode(b"desk:fathom").decode()
    return {"Authorization": f"Basic {token}"}


def test_vercel_uses_the_instance_file(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.delenv("FATHOM_DATABASE_URL", raising=False)
    monkeypatch.delenv("FATHOM_DB", raising=False)
    from app.db import database_url, reset_engine

    reset_engine()
    assert database_url() == "sqlite:////tmp/fathom.db"
    reset_engine()


def test_booking_is_visible_to_the_next_request(monkeypatch):
    monkeypatch.setenv("FATHOM_DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.delenv("FATHOM_DB", raising=False)
    os.environ["FATHOM_DATABASE_URL"] = "sqlite:///:memory:"
    from app.db import reset_engine, session_local
    from app.main import create_app
    from app.models import Trade

    reset_engine()
    with TestClient(create_app()) as client:
        client.headers.update(_auth())
        before = client.get("/fathom/api/Trades")
        assert before.status_code == 200
        count = before.json()["Count"]
        booked = client.post(
            "/fathom/api/Trades",
            json={
                "Product": "Lesson 5Y payer",
                "ProductType": "IRS",
                "Book": "LN-RATES",
                "Party": "HELIOS",
                "Direction": "PAY",
                "Notional": 5000000,
                "SettleCurrency": "USD",
                "FixedRate": 0.04,
                "TradeTime": "2026-09-25",
                "SettlementDate": "2026-09-29",
                "Maturity": "2031-09-29",
                "PayFrequency": "6M",
            },
        )
        assert booked.status_code == 201, booked.text
        again = client.get("/fathom/api/Trades")
        assert again.status_code == 200
        assert again.json()["Count"] == count + 1
        assert any(row["Product"] == "Lesson 5Y payer" for row in again.json()["Trades"])
        db = session_local()
        try:
            assert db.query(Trade).filter(Trade.instrument_name == "Lesson 5Y payer").count() == 1
        finally:
            db.close()
    reset_engine()
    os.environ.pop("FATHOM_DATABASE_URL", None)
