"""Book a trade, see it price, and see risk and P&L notice it."""

import base64
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    path = str(tmp_path / "flow.db")
    monkeypatch.setenv("FATHOM_DB", path)
    os.environ["FATHOM_DB"] = path
    from app.db import reset_engine

    reset_engine()
    from app.main import create_app

    with TestClient(create_app()) as test_client:
        token = base64.b64encode(b"desk:fathom").decode()
        test_client.headers["Authorization"] = f"Basic {token}"
        yield test_client
    reset_engine()


def test_seed_prices_and_market_bump_moves_a_bond(client: TestClient):
    ping = client.get("/fathom/Monitoring/Ping")
    assert ping.status_code == 200
    assert ping.json()["ValuationDate"] == "2026-09-25"

    blotter = client.get("/fathom/api/Trades")
    assert blotter.status_code == 200
    assert blotter.json()["Count"] >= 15

    bond = next(row for row in blotter.json()["Trades"] if row["TradingSystemReference"] == "FT-1001")
    priced = client.get("/fathom/api/Pricing/GetTradePriceFromTradeId", params={"tradeId": bond["Id"]})
    assert priced.status_code == 200, priced.text
    body = priced.json()
    assert body["Model"].startswith("QuantLib")
    assert body["PvUsd"] > 0
    assert 90 < body["Measures"]["CleanPrice"] < 110

    before = client.get("/fathom/api/Risk/AnalysisReport", params={"analysisName": "Sensitivities"}).json()
    bond_row = next(row for row in before["Rows"] if row["TradeRef"] == "FT-1001")
    assert bond_row["Dv01"] > 0

    curve = client.get(
        "/fathom/api/InterestCurve/GetMostRecentInterestCurve",
        params={"currency": "USD", "name": "USD-DISC", "setupName": "Official"},
    ).json()
    for pillar in curve["Pillars"]:
        pillar["Rate"] += 0.001
    updated = client.post("/fathom/api/InterestCurve/SaveInterestCurve", json=curve)
    assert updated.status_code == 200, updated.text
    repriced = client.get("/fathom/api/Pricing/GetTradePriceFromTradeId", params={"tradeId": bond["Id"]}).json()
    assert repriced["PvUsd"] < body["PvUsd"]

    pnl = client.get("/fathom/api/Report/PLReport/Default").json()
    assert pnl["ReportType"] == "PLReport"
    assert pnl["Totals"]["Total"] != 0

    var = client.get("/fathom/api/Report/VaRReport/Default").json()
    assert var["Historical"]["Var99"] >= var["Historical"]["Var95"] > 0
    assert var["Parametric"]["Var99"] > var["Parametric"]["Var95"] > 0

    stress = client.get("/fathom/api/Report/ScenarioReport/Default").json()
    assert len(stress["Scenarios"]) >= 5

    ladder = client.get("/fathom/api/Report/CashFlowReport/Default").json()
    assert ladder["Ladder"]

    positions = client.get("/fathom/api/Position/LoadPositionsFromFilter", params={"pricingSetupName": "Official"}).json()
    assert positions["Rows"]

    named = client.get("/fathom/api/Report/FrtbReport/Default")
    assert named.status_code == 404
