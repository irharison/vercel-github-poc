"""Lifecycle state machine through the HTTP API."""

import base64
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FATHOM_DB", str(tmp_path / "lifecycle.db"))
    os.environ["FATHOM_DB"] = str(tmp_path / "lifecycle.db")
    from app.db import reset_engine

    reset_engine()
    from app.main import create_app

    with TestClient(create_app()) as test_client:
        token = base64.b64encode(b"desk:fathom").decode()
        test_client.headers["Authorization"] = f"Basic {token}"
        yield test_client
    reset_engine()


def _irs(client: TestClient) -> dict:
    response = client.post(
        "/fathom/api/Trades",
        json={
            "ProductType": "IRS",
            "Product": "Test USD 2Y pay 4%",
            "Book": "LN-RATES",
            "Party": "HELIOS",
            "Direction": "PAY",
            "Notional": 5000000,
            "SettleCurrency": "USD",
            "FixedRate": 0.04,
            "TradeTime": "2026-09-25",
            "SettlementDate": "2026-09-29",
            "Maturity": "2028-09-29",
            "PayFrequency": "6M",
            "Trader": "desk",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_ping_is_public_and_login_needs_basic(tmp_path, monkeypatch):
    monkeypatch.setenv("FATHOM_DB", str(tmp_path / "auth.db"))
    os.environ["FATHOM_DB"] = str(tmp_path / "auth.db")
    from app.db import reset_engine

    reset_engine()
    from app.main import create_app

    with TestClient(create_app()) as bare:
        ping = bare.get("/fathom/Monitoring/Ping")
        assert ping.status_code == 200
        assert ping.json()["Status"] == "ok"
        denied = bare.get("/fathom/api/Trades")
        assert denied.status_code == 401
        token = base64.b64encode(b"ops:fathom").decode()
        allowed = bare.get("/fathom/api/User/Login", headers={"Authorization": f"Basic {token}"})
        assert allowed.status_code == 200
        assert allowed.json()["Username"] == "ops"
    reset_engine()


def test_happy_path_booked_to_settled(client: TestClient):
    trade = _irs(client)
    assert trade["Status"] == "BOOKED"
    assert trade["Events"][0]["EventType"] == "Booked"
    trade_id = trade["Id"]
    for action, status, event_type in (
        ("verify", "VERIFIED", "Verified"),
        ("confirm", "CONFIRMED", "Confirmed"),
        ("settle", "SETTLED", "SettlementEvent"),
    ):
        response = client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": action, "Message": "Checked."})
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["Status"] == status
        assert body["LastEventType"] == event_type
    events = client.get(f"/fathom/api/Trades/{trade_id}/Events").json()["Events"]
    assert [event["EventType"] for event in events] == ["Booked", "Verified", "Confirmed", "SettlementEvent"]


def test_cannot_skip_or_leave_terminal_states(client: TestClient):
    trade = _irs(client)
    trade_id = trade["Id"]
    skipped = client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "confirm"})
    assert skipped.status_code == 409
    assert "BOOKED" in skipped.json()["detail"]

    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "verify"})
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "confirm"})
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "settle"})
    again = client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "verify"})
    assert again.status_code == 409

    cancelled = _irs(client)
    gone = client.put("/fathom/api/Trades", json={"Id": cancelled["Id"], "Action": "cancel", "Message": "Pulled."})
    assert gone.status_code == 200
    assert gone.json()["Status"] == "CANCELLED"
    assert gone.json()["LastEventType"] == "TerminationEvent"
    blocked = client.put("/fathom/api/Trades", json={"Id": cancelled["Id"], "Action": "verify"})
    assert blocked.status_code == 409


def test_amend_resets_to_booked_and_records_diff(client: TestClient):
    trade = _irs(client)
    trade_id = trade["Id"]
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "verify"})
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "confirm"})
    payload = {
        "Id": trade_id,
        "ProductType": "IRS",
        "Product": "Test USD 2Y pay 4.10%",
        "Book": "LN-RATES",
        "Party": "HELIOS",
        "Direction": "PAY",
        "Notional": 6000000,
        "SettleCurrency": "USD",
        "FixedRate": 0.041,
        "TradeTime": "2026-09-25",
        "SettlementDate": "2026-09-29",
        "Maturity": "2028-09-29",
        "PayFrequency": "6M",
        "Trader": "desk",
        "Message": "Client resized the swap.",
    }
    amended = client.put("/fathom/api/Trades", json=payload)
    assert amended.status_code == 200, amended.text
    body = amended.json()
    assert body["Status"] == "BOOKED"
    assert body["Notional"] == 6_000_000
    assert body["LastEventType"] == "AmendEvent"
    amended_event = [event for event in body["Events"] if event["EventType"] == "AmendEvent"][-1]
    assert amended_event["FromStatus"] == "CONFIRMED"
    assert amended_event["ToStatus"] == "BOOKED"
    assert "notional" in amended_event["Payload"]["changes"]

    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "verify"})
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "confirm"})
    client.put("/fathom/api/Trades", json={"Id": trade_id, "Action": "settle"})
    closed = client.put("/fathom/api/Trades", json=payload)
    assert closed.status_code == 409


def test_ticket_validation_rejects_bad_rate(client: TestClient):
    response = client.post(
        "/fathom/api/Trades",
        json={
            "ProductType": "BOND",
            "Product": "Bad coupon",
            "Book": "LN-RATES",
            "Party": "HELIOS",
            "Direction": "BUY",
            "Notional": 1000000,
            "SettleCurrency": "USD",
            "FixedRate": 1.5,
            "TradeTime": "2026-09-25",
            "SettlementDate": "2026-03-15",
            "Maturity": "2031-03-15",
            "PayFrequency": "6M",
        },
    )
    assert response.status_code == 400
    assert any(error["field"] == "FixedRate" for error in response.json()["detail"])
