"""JSON shapes for the learning API.

Names follow the Derivitec Orchestrade.Client snapshot where this demo has the
same concept: Party, Book, Action, LastEventType, ClosingName, PricingSetup.
Report rows are the same analytics dicts with PascalCase keys.
"""

from __future__ import annotations

import json
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Book,
    Calendar,
    CommodityForward,
    Counterparty,
    CsaAgreement,
    Currency,
    CurrencyPair,
    CurvePillar,
    EquityQuote,
    FxSpot,
    FxVol,
    PricingSetupRow,
    SavedFilter,
    Trade,
    TradeEvent,
)

PUBLIC_FIELDS = {
    "product_type": "ProductType",
    "instrument_name": "Product",
    "book": "Book",
    "counterparty": "Party",
    "direction": "Direction",
    "notional": "Notional",
    "notional_currency": "SettleCurrency",
    "secondary_currency": "SecondaryCurrency",
    "fixed_rate": "FixedRate",
    "strike": "Strike",
    "premium": "Premium",
    "quantity": "ContractQuantity",
    "multiplier": "Multiplier",
    "underlying": "Underlying",
    "option_type": "OptionType",
    "trade_date": "TradeTime",
    "start_date": "SettlementDate",
    "maturity_date": "Maturity",
    "pay_frequency": "PayFrequency",
}


def pascalize(value):
    if isinstance(value, list):
        return [pascalize(item) for item in value]
    if isinstance(value, dict):
        return {_pascal_key(key): pascalize(item) for key, item in value.items()}
    return value


def _pascal_key(key: str) -> str:
    if key[:1].isupper() or "_" not in key and key[:1].islower() is False:
        return key
    return "".join(part[:1].upper() + part[1:] for part in key.split("_") if part)


def public_errors(errors: list[dict]) -> list[dict]:
    out = []
    for item in errors:
        field = item.get("field", "")
        out.append({**item, "field": PUBLIC_FIELDS.get(field, field)})
    return out


def event_out(event: TradeEvent) -> dict:
    try:
        payload = json.loads(event.payload or "{}")
    except json.JSONDecodeError:
        payload = {}
    return {
        "Id": event.id,
        "EventType": event.event_type,
        "FromStatus": event.from_status,
        "ToStatus": event.to_status,
        "Actor": event.actor,
        "Message": event.message,
        "Payload": payload,
        "CreatedAt": event.created_at.isoformat() if event.created_at else None,
    }


def trade_out(trade: Trade, with_events: bool = False, valuation: dict | None = None) -> dict:
    last = trade.events[-1] if trade.events else None
    action = None
    if last:
        try:
            action = json.loads(last.payload or "{}").get("Action")
        except json.JSONDecodeError:
            action = None
    data = {
        "Id": trade.id,
        "TradingSystemReference": trade.trade_ref,
        "ProductType": trade.product_type,
        "Product": trade.instrument_name,
        "Status": trade.status,
        "BookId": trade.book_id,
        "Book": trade.book.code,
        "BookName": trade.book.name,
        "PartyId": trade.counterparty_id,
        "Party": trade.counterparty.code,
        "PartyName": trade.counterparty.name,
        "Direction": trade.direction,
        "Notional": trade.notional,
        "Quantity": trade.notional,
        "SettleCurrency": trade.notional_currency,
        "SecondaryCurrency": trade.secondary_currency,
        "FixedRate": trade.fixed_rate,
        "Price": trade.fixed_rate if trade.fixed_rate is not None else trade.strike,
        "Strike": trade.strike,
        "Premium": trade.premium,
        "ContractQuantity": trade.quantity,
        "Multiplier": trade.multiplier,
        "Underlying": trade.underlying,
        "OptionType": trade.option_type,
        "TradeTime": trade.trade_date.isoformat(),
        "SettlementDate": trade.start_date.isoformat(),
        "Maturity": trade.maturity_date.isoformat(),
        "PayFrequency": trade.pay_frequency,
        "Trader": trade.trader,
        "Notes": trade.notes,
        "Action": action,
        "LastEventType": last.event_type if last else None,
        "LastEventId": last.id if last else None,
        "UpdatedAt": trade.updated_at.isoformat() if trade.updated_at else None,
    }
    if with_events:
        data["Events"] = [event_out(event) for event in trade.events]
    if valuation is not None:
        data["Valuation"] = pascalize(valuation)
    return data


def trade_query(db: Session):
    return db.query(Trade).options(joinedload(Trade.book), joinedload(Trade.counterparty), joinedload(Trade.events))


def unique_trades(rows) -> list[Trade]:
    seen: set[int] = set()
    out = []
    for trade in rows:
        if trade.id in seen:
            continue
        seen.add(trade.id)
        out.append(trade)
    return out


def _actual(trade: Trade, element: str):
    return {
        "Book": trade.book.code,
        "Party": trade.counterparty.code,
        "TradeStatus": trade.status,
        "ProductType": trade.product_type,
        "Trader": trade.trader,
        "MaturityDate": trade.maturity_date.isoformat(),
    }.get(element)


def matches(trade: Trade, criteria: list[dict]) -> bool:
    for item in criteria:
        element = item.get("ElementType")
        condition = item.get("ElementCondition")
        values = [str(value) for value in item.get("Values") or []]
        actual = _actual(trade, element)
        if actual is None or condition is None:
            continue
        if condition == "In" and actual not in values:
            return False
        if condition == "NotIn" and actual in values:
            return False
        if condition == "Like" and not any(value.lower() in actual.lower() for value in values):
            return False
        if condition == "Before" and not (values and actual < values[0]):
            return False
        if condition == "After" and not (values and actual > values[0]):
            return False
    return True


def load_filter(db: Session, name: str) -> SavedFilter:
    row = db.get(SavedFilter, name)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Unknown filter '{name}'.")
    return row


def criteria_for(db: Session, filter_name: str | None, book: str | None) -> list[dict]:
    criteria: list[dict] = []
    if filter_name:
        row = load_filter(db, filter_name)
        criteria.extend(json.loads(row.criteria or "[]"))
    if book:
        criteria.append({"ElementType": "Book", "ElementCondition": "In", "Values": [book]})
    return criteria


def matching_ids(db: Session, filter_name: str | None, book: str | None) -> set[int] | None:
    criteria = criteria_for(db, filter_name, book)
    if not criteria:
        return None
    ids = set()
    for trade in unique_trades(trade_query(db).order_by(Trade.id).all()):
        if matches(trade, criteria):
            ids.add(trade.id)
    return ids


def party_out(row: Counterparty) -> dict:
    return {
        "Id": row.id,
        "Code": row.code,
        "Name": row.name,
        "Role": row.role,
        "City": row.city,
        "Active": bool(row.active),
    }


def book_out(row: Book) -> dict:
    return {
        "Id": row.id,
        "Code": row.code,
        "Name": row.name,
        "Desk": row.desk,
        "BaseCurrency": row.base_currency,
        "Active": bool(row.active),
    }


def calendar_out(row: Calendar) -> dict:
    holidays = sorted(row.holidays, key=lambda item: item.holiday_date)
    return {
        "Name": row.code,
        "Description": row.name,
        "Center": row.center,
        "Holidays": [{"Date": item.holiday_date.isoformat(), "Name": item.name} for item in holidays],
    }


def currency_out(row: Currency) -> dict:
    return {"IsoCode": row.code, "Name": row.name, "MinorUnits": row.minor_units}


def pair_out(row: CurrencyPair) -> dict:
    return {"Name": row.name, "Primary": row.primary, "Quoting": row.quoting}


def csa_out(row: CsaAgreement) -> dict:
    return {
        "Id": row.id,
        "Name": row.name,
        "Party": row.party_code,
        "Currency": row.currency,
        "Threshold": row.threshold,
        "IndependentAmount": row.independent_amount,
        "Active": bool(row.active),
    }


def closing_name(as_of: date) -> str:
    return f"EOD-{as_of.isoformat()}"


def quotes_for(db: Session, as_of: date) -> list[dict]:
    quotes = []
    for row in db.query(FxSpot).filter(FxSpot.as_of == as_of).order_by(FxSpot.pair):
        quotes.append({"QuoteName": f"FX.{row.pair}.SPOT", "Value": row.spot, "QuoteDate": as_of.isoformat()})
    for row in db.query(FxVol).filter(FxVol.as_of == as_of).order_by(FxVol.pair):
        quotes.append({"QuoteName": f"FX.{row.pair}.VOL", "Value": row.vol, "QuoteDate": as_of.isoformat()})
    for row in db.query(EquityQuote).filter(EquityQuote.as_of == as_of).order_by(EquityQuote.ticker):
        quotes.append({"QuoteName": f"EQ.{row.ticker}.SPOT", "Value": row.spot, "QuoteDate": as_of.isoformat()})
        quotes.append({"QuoteName": f"EQ.{row.ticker}.VOL", "Value": row.vol, "QuoteDate": as_of.isoformat()})
        quotes.append({"QuoteName": f"EQ.{row.ticker}.DIV", "Value": row.dividend_yield, "QuoteDate": as_of.isoformat()})
    return quotes


def interest_curve_out(db: Session, as_of: date, currency: str, name: str, setup: str) -> dict:
    pillars = (
        db.query(CurvePillar)
        .filter(CurvePillar.as_of == as_of, CurvePillar.currency == currency)
        .all()
    )
    order = {"1M": 1, "3M": 2, "6M": 3, "1Y": 4, "2Y": 5, "3Y": 6, "5Y": 7, "7Y": 8, "10Y": 9, "20Y": 10, "30Y": 11}
    pillars.sort(key=lambda row: order.get(row.tenor, 99))
    return {
        "Currency": currency,
        "Name": name,
        "SetupName": setup,
        "CurveTime": as_of.isoformat(),
        "Pillars": [{"Tenor": row.tenor, "Instrument": row.pillar_type, "Rate": row.rate} for row in pillars],
    }


def commodity_curve_out(db: Session, as_of: date, commodity_id: str, setup: str) -> dict:
    rows = (
        db.query(CommodityForward)
        .filter(CommodityForward.as_of == as_of, CommodityForward.underlying == commodity_id)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"No commodity curve for {commodity_id}.")
    order = {"1M": 1, "3M": 2, "6M": 3, "1Y": 4, "2Y": 5}
    rows.sort(key=lambda row: order.get(row.tenor, 99))
    first = rows[0]
    return {
        "CommodityId": commodity_id,
        "CurveName": commodity_id,
        "Name": first.name,
        "SetupName": setup,
        "CurveTime": as_of.isoformat(),
        "Currency": first.currency,
        "Unit": first.unit,
        "Pillars": [{"Tenor": row.tenor, "Price": row.price} for row in rows],
    }


def setup_out(row: PricingSetupRow) -> dict:
    return {
        "Name": row.name,
        "ClosingName": row.closing_name,
        "Currency": row.currency,
        "Description": row.description,
    }
