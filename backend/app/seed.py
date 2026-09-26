"""Fictional books, names, and levels. Nothing here is a real firm or a real close."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta

import numpy as np
from sqlalchemy.orm import Session

from app.lifecycle import record_event
from app.marketdata import calendar_for, clear_curve_cache, from_ql, to_ql
from app.models import (
    AppSetting,
    Book,
    Calendar,
    CommodityForward,
    Counterparty,
    CsaAgreement,
    Currency,
    CurrencyPair,
    CurvePillar,
    DeskTask,
    DeskUser,
    EquityQuote,
    FactorReturn,
    FxSpot,
    FxVol,
    Holiday,
    PricingSetupRow,
    RateIndex,
    SavedFilter,
    Trade,
)

VALUATION = date(2026, 9, 25)
PREVIOUS = date(2026, 9, 24)

CURVES = {
    "USD": [
        ("1M", "deposit", 0.0430),
        ("3M", "deposit", 0.0425),
        ("6M", "deposit", 0.0420),
        ("1Y", "swap", 0.0410),
        ("2Y", "swap", 0.0402),
        ("3Y", "swap", 0.0398),
        ("5Y", "swap", 0.0395),
        ("7Y", "swap", 0.0398),
        ("10Y", "swap", 0.0405),
        ("20Y", "swap", 0.0415),
        ("30Y", "swap", 0.0412),
    ],
    "EUR": [
        ("1M", "deposit", 0.0240),
        ("3M", "deposit", 0.0235),
        ("6M", "deposit", 0.0230),
        ("1Y", "swap", 0.0225),
        ("2Y", "swap", 0.0228),
        ("5Y", "swap", 0.0240),
        ("10Y", "swap", 0.0255),
        ("30Y", "swap", 0.0260),
    ],
    "GBP": [
        ("1M", "deposit", 0.0400),
        ("3M", "deposit", 0.0395),
        ("6M", "deposit", 0.0390),
        ("1Y", "swap", 0.0380),
        ("2Y", "swap", 0.0375),
        ("5Y", "swap", 0.0370),
        ("10Y", "swap", 0.0385),
        ("30Y", "swap", 0.0400),
    ],
    "JPY": [
        ("1M", "deposit", 0.0050),
        ("3M", "deposit", 0.0055),
        ("6M", "deposit", 0.0060),
        ("1Y", "swap", 0.0075),
        ("2Y", "swap", 0.0090),
        ("5Y", "swap", 0.0110),
        ("10Y", "swap", 0.0140),
        ("30Y", "swap", 0.0180),
    ],
}

FX_TODAY = {"EURUSD": 1.0850, "GBPUSD": 1.3120, "USDJPY": 149.20}
FX_YDAY = {"EURUSD": 1.0810, "GBPUSD": 1.3080, "USDJPY": 148.70}
FX_VOL_TODAY = {"EURUSD": 0.082, "GBPUSD": 0.090, "USDJPY": 0.105}
FX_VOL_YDAY = {"EURUSD": 0.079, "GBPUSD": 0.087, "USDJPY": 0.102}

EQUITIES = [
    # ticker, name, ccy, spot today, spot yday, vol today, vol yday, dividend
    ("AETHER", "Aether Robotics", "USD", 86.40, 85.10, 0.220, 0.214, 0.012),
    ("BRIGHTLINE", "Brightline Media", "USD", 142.10, 144.00, 0.280, 0.272, 0.005),
    ("CINDERCO", "Cinder & Co", "USD", 54.75, 53.20, 0.350, 0.340, 0.000),
]

COMMODITIES = {
    "BRENT": ("Brent crude", "USD", "bbl", [("1M", 78.20, 77.40), ("3M", 77.40, 76.80), ("6M", 76.50, 76.10), ("1Y", 75.10, 74.80)]),
    "TTF": ("TTF natural gas", "EUR", "MWh", [("1M", 34.50, 35.20), ("3M", 35.20, 35.80), ("6M", 36.00, 36.40), ("1Y", 37.40, 37.60)]),
    "API2": ("API2 coal", "USD", "t", [("1M", 112.0, 113.5), ("3M", 114.0, 115.0), ("6M", 116.0, 116.8), ("1Y", 118.0, 118.4)]),
}


def _dt(d: date, hour: int = 15) -> datetime:
    return datetime(d.year, d.month, d.day, hour, 30, 0)


def _add_pillars(db: Session, as_of: date, shift: float) -> None:
    for ccy, pillars in CURVES.items():
        for tenor, kind, rate in pillars:
            db.add(CurvePillar(as_of=as_of, currency=ccy, tenor=tenor, pillar_type=kind, rate=rate + shift))


def _add_market(db: Session, as_of: date, shift: float, fx: dict, fx_vol: dict, equity_index: int) -> None:
    _add_pillars(db, as_of, shift)
    for pair, spot in fx.items():
        db.add(FxSpot(as_of=as_of, pair=pair, spot=spot))
        db.add(FxVol(as_of=as_of, pair=pair, vol=fx_vol[pair]))
    for ticker, name, ccy, spot_t, spot_y, vol_t, vol_y, div in EQUITIES:
        db.add(
            EquityQuote(
                as_of=as_of,
                ticker=ticker,
                name=name,
                currency=ccy,
                spot=spot_t if equity_index == 0 else spot_y,
                vol=vol_t if equity_index == 0 else vol_y,
                dividend_yield=div,
            )
        )
    for underlying, (name, ccy, unit, pillars) in COMMODITIES.items():
        for tenor, today_px, yday_px in pillars:
            db.add(
                CommodityForward(
                    as_of=as_of,
                    underlying=underlying,
                    name=name,
                    tenor=tenor,
                    price=today_px if equity_index == 0 else yday_px,
                    currency=ccy,
                    unit=unit,
                )
            )


def _business_days_back(end: date, count: int) -> list[date]:
    days = []
    cursor = end
    while len(days) < count:
        if cursor.weekday() < 5:
            days.append(cursor)
        cursor -= timedelta(days=1)
    return list(reversed(days))


def _seed_factors(db: Session) -> None:
    """Synthetic daily moves with a shared rates factor and a shared equity factor. Not a market history."""
    rng = np.random.default_rng(7)
    dates = _business_days_back(PREVIOUS, 60)
    n = len(dates)
    rate = rng.standard_normal(n)
    equity = rng.standard_normal(n)
    usd = rng.standard_normal(n)
    energy = rng.standard_normal(n)
    idiosyncratic = rng.standard_normal((n, 16))

    def mix(scale: float, *parts: np.ndarray) -> np.ndarray:
        return scale * sum(parts)

    series = {
        "USD_RATE": mix(3.2, 0.75 * rate, 0.35 * idiosyncratic[:, 0]),
        "EUR_RATE": mix(2.8, 0.70 * rate, 0.40 * idiosyncratic[:, 1]),
        "GBP_RATE": mix(3.6, 0.65 * rate, 0.45 * idiosyncratic[:, 2]),
        "JPY_RATE": mix(1.5, 0.40 * rate, 0.50 * idiosyncratic[:, 3]),
        "EURUSD": mix(0.0055, 0.65 * usd, 0.40 * idiosyncratic[:, 4]),
        "GBPUSD": mix(0.0060, 0.55 * usd, 0.45 * idiosyncratic[:, 5]),
        "USDJPY": mix(0.0065, -0.50 * usd, 0.50 * idiosyncratic[:, 6]),
        "EQ_AETHER": mix(0.014, 0.75 * equity, 0.40 * idiosyncratic[:, 7]),
        "EQ_BRIGHTLINE": mix(0.016, 0.70 * equity, 0.45 * idiosyncratic[:, 8]),
        "EQ_CINDERCO": mix(0.020, 0.60 * equity, 0.55 * idiosyncratic[:, 9]),
        "BRENT": mix(0.018, 0.35 * equity, 0.70 * energy, 0.30 * idiosyncratic[:, 10]),
        "TTF": mix(0.028, 0.55 * energy, 0.50 * idiosyncratic[:, 11]),
        "API2": mix(0.015, 0.45 * energy, 0.50 * idiosyncratic[:, 12]),
        "VOL_EQ": mix(0.55, -0.65 * equity, 0.40 * idiosyncratic[:, 13]),
        "VOL_FX": mix(0.22, 0.30 * np.abs(usd) * np.sign(rng.standard_normal(n)), 0.50 * idiosyncratic[:, 14]),
    }
    for d in dates:
        i = dates.index(d)
        for factor, values in series.items():
            db.add(FactorReturn(scenario_date=d, factor=factor, value=float(values[i])))


def _seed_holidays(db: Session) -> None:
    calendars = [
        ("NYC", "New York government bond", "United States", "USD"),
        ("TARGET", "TARGET", "Euro area", "EUR"),
        ("LON", "London", "United Kingdom", "GBP"),
        ("TKY", "Tokyo", "Japan", "JPY"),
    ]
    start = to_ql(date(2026, 9, 1))
    end = to_ql(date(2027, 12, 31))
    import QuantLib as ql

    for code, name, center, ccy in calendars:
        cal_row = Calendar(code=code, name=name, center=center)
        db.add(cal_row)
        ql_cal = calendar_for(ccy)
        d = start
        while d <= end:
            if (not ql_cal.isBusinessDay(d)) and d.weekday() not in (ql.Saturday, ql.Sunday):
                db.add(Holiday(calendar_code=code, holiday_date=from_ql(d), name="Exchange holiday"))
            d = d + 1


_EVENT_NAMES = {
    "BOOKED": "Booked",
    "VERIFIED": "Verified",
    "CONFIRMED": "Confirmed",
    "SETTLED": "SettlementEvent",
    "CANCELLED": "TerminationEvent",
    "AMENDED": "AmendEvent",
}


def _trade(db: Session, books: dict, parties: dict, spec: dict) -> Trade:
    when = _dt(spec["trade_date"])
    trade = Trade(
        trade_ref=spec["trade_ref"],
        product_type=spec["product_type"],
        instrument_name=spec["instrument_name"],
        status="BOOKED",
        book_id=books[spec["book"]].id,
        counterparty_id=parties[spec["counterparty"]].id,
        direction=spec["direction"],
        notional=spec["notional"],
        notional_currency=spec["notional_currency"],
        secondary_currency=spec.get("secondary_currency"),
        fixed_rate=spec.get("fixed_rate"),
        strike=spec.get("strike"),
        premium=spec.get("premium"),
        quantity=spec.get("quantity"),
        multiplier=spec.get("multiplier"),
        underlying=spec.get("underlying"),
        option_type=spec.get("option_type"),
        trade_date=spec["trade_date"],
        start_date=spec["start_date"],
        maturity_date=spec["maturity_date"],
        pay_frequency=spec.get("pay_frequency", "6M"),
        trader=spec.get("trader", "A. Okonkwo"),
        notes=spec.get("notes", ""),
        created_at=when,
        updated_at=when,
    )
    db.add(trade)
    db.flush()
    db.add(
        record_event(
            trade,
            "Booked",
            None,
            "BOOKED",
            trade.trader,
            spec.get("book_message", "Trade booked."),
            when=when,
        )
    )
    history = spec.get("history", [])
    for step in history:
        trade.status = step["to"]
        trade.updated_at = step["when"]
        db.add(
            record_event(
                trade,
                _EVENT_NAMES.get(step["event"], step["event"]),
                step["from"],
                step["to"],
                step.get("actor", trade.trader),
                step.get("message", ""),
                step.get("payload"),
                when=step["when"],
            )
        )
    return trade


def seed_reference(db: Session) -> None:
    """Users, filters, CSA agreements, and other reference rows the API groups expect."""
    if db.query(DeskUser).count() == 0:
        db.add(DeskUser(username="desk", password="fathom", display_name="Harper Quill", role="Trader"))
        db.add(DeskUser(username="ops", password="fathom", display_name="Rowan Ash", role="Operations"))
    if db.query(SavedFilter).count() == 0:
        filters = [
            ("All", "Every trade on the desk.", []),
            ("NeedsVerification", "Trades still in Booked.", [{"ElementType": "TradeStatus", "ElementCondition": "In", "Values": ["BOOKED"]}]),
            ("Open", "Not settled and not cancelled.", [{"ElementType": "TradeStatus", "ElementCondition": "In", "Values": ["BOOKED", "VERIFIED", "CONFIRMED"]}]),
            ("RatesBook", "London rates book.", [{"ElementType": "Book", "ElementCondition": "In", "Values": ["LN-RATES"]}]),
            ("EnergyBook", "Singapore energy book.", [{"ElementType": "Book", "ElementCondition": "In", "Values": ["SG-ENRG"]}]),
        ]
        for name, description, criteria in filters:
            db.add(SavedFilter(name=name, description=description, criteria=json.dumps(criteria)))
    if db.query(CsaAgreement).count() == 0:
        db.add(CsaAgreement(name="NW-BANK-CSA", party_code="NW-BANK", currency="USD", threshold=5_000_000, independent_amount=0, active=1))
        db.add(CsaAgreement(name="HELIOS-CSA", party_code="HELIOS", currency="USD", threshold=1_000_000, independent_amount=250_000, active=1))
    if db.query(PricingSetupRow).count() == 0:
        db.add(PricingSetupRow(name="Official", closing_name=f"EOD-{VALUATION.isoformat()}", currency="USD", description="Today's fictional close."))
        db.add(PricingSetupRow(name="Previous", closing_name=f"EOD-{PREVIOUS.isoformat()}", currency="USD", description="Yesterday's close, frozen for the P&L explain."))
    if db.query(DeskTask).count() == 0:
        db.add(DeskTask(id=1, name="EodBatch", status="Idle", description="Named only. This demo does not run an end-of-day batch."))
        db.add(DeskTask(id=2, name="SampleReset", status="Idle", description="Restores the fictional seed book. Run it from the desk header."))
    if db.query(RateIndex).count() == 0:
        for ccy in ("USD", "EUR", "GBP", "JPY"):
            db.add(RateIndex(currency=ccy, name=f"{ccy}-IBOR-6M", tenor="6M"))
    if db.query(CurrencyPair).count() == 0:
        db.add(CurrencyPair(name="EURUSD", primary="EUR", quoting="USD"))
        db.add(CurrencyPair(name="GBPUSD", primary="GBP", quoting="USD"))
        db.add(CurrencyPair(name="USDJPY", primary="USD", quoting="JPY"))


def seed(db: Session) -> None:
    clear_curve_cache()
    books = {}
    for code, name, desk, ccy in [
        ("LN-RATES", "London Rates Flow", "Rates", "USD"),
        ("NY-FX", "New York FX", "FX", "USD"),
        ("LN-EQD", "London Equity Derivatives", "Equity", "USD"),
        ("SG-ENRG", "Singapore Energy", "Energy", "USD"),
        ("LN-TREAS", "Treasury Funding", "Treasury", "EUR"),
    ]:
        row = Book(code=code, name=name, desk=desk, base_currency=ccy, active=1)
        db.add(row)
        books[code] = row
    parties = {}
    for code, name, role, city in [
        ("NW-BANK", "Northwind Bank plc", "Bank", "London"),
        ("HELIOS", "Helios Macro Fund LP", "Hedge fund", "New York"),
        ("MARLOWE", "Marlowe Asset Management", "Asset manager", "Edinburgh"),
        ("CINDER", "Cinder Energy Trading Ltd", "Energy merchant", "Singapore"),
        ("PELLINORE", "Pellinore Securities", "Broker", "New York"),
        ("GREY", "Greyharbour Capital", "Hedge fund", "Greenwich"),
        ("ASH", "Ash & Rowan Private Bank", "Private bank", "Zurich"),
    ]:
        row = Counterparty(code=code, name=name, role=role, city=city, active=1)
        db.add(row)
        parties[code] = row
    for code, name, units in [("USD", "US dollar", 2), ("EUR", "Euro", 2), ("GBP", "Sterling", 2), ("JPY", "Yen", 0)]:
        db.add(Currency(code=code, name=name, minor_units=units))
    db.add(AppSetting(key="valuation_date", value=VALUATION.isoformat()))
    db.add(AppSetting(key="previous_date", value=PREVIOUS.isoformat()))
    db.add(AppSetting(key="base_currency", value="USD"))
    _add_market(db, VALUATION, 0.0, FX_TODAY, FX_VOL_TODAY, 0)
    _add_market(db, PREVIOUS, -0.0003, FX_YDAY, FX_VOL_YDAY, 1)
    _seed_factors(db)
    _seed_holidays(db)
    db.flush()

    def h(day: date, event: str, frm: str, to: str, message: str, hour: int = 11, payload=None, actor: str = "M. Cho"):
        return {"when": _dt(day, hour), "event": event, "from": frm, "to": to, "message": message, "payload": payload, "actor": actor}

    specs = [
        dict(
            trade_ref="FT-1001",
            product_type="BOND",
            instrument_name="Northwind 4.00 15 Mar 2031",
            book="LN-RATES",
            counterparty="NW-BANK",
            direction="BUY",
            notional=10_000_000,
            notional_currency="USD",
            fixed_rate=0.04,
            trade_date=date(2026, 3, 12),
            start_date=date(2026, 3, 15),
            maturity_date=date(2031, 3, 15),
            pay_frequency="6M",
            trader="A. Okonkwo",
            notes="Fictional USD fixed-rate bond held in the rates book.",
            history=[
                h(date(2026, 3, 12), "VERIFIED", "BOOKED", "VERIFIED", "Economics checked against the ticket."),
                h(date(2026, 3, 13), "CONFIRMED", "VERIFIED", "CONFIRMED", "Counterparty confirmation matched."),
            ],
        ),
        dict(
            trade_ref="FT-1002",
            product_type="BOND",
            instrument_name="Ash Rowan 3.25 20 Sep 2030",
            book="LN-TREAS",
            counterparty="ASH",
            direction="BUY",
            notional=5_000_000,
            notional_currency="EUR",
            fixed_rate=0.0325,
            trade_date=date(2025, 9, 18),
            start_date=date(2025, 9, 20),
            maturity_date=date(2030, 9, 20),
            pay_frequency="1Y",
            trader="L. Varga",
            notes="Treasury holding. Settlement of the purchase is done; the bond still has price risk.",
            history=[
                h(date(2025, 9, 18), "VERIFIED", "BOOKED", "VERIFIED", "Static data and coupon checked.", actor="L. Varga"),
                h(date(2025, 9, 19), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched.", actor="M. Cho"),
                h(date(2025, 9, 22), "SETTLED", "CONFIRMED", "SETTLED", "Purchase cash and bonds settled.", actor="R. Iqbal"),
            ],
        ),
        dict(
            trade_ref="FT-1003",
            product_type="IRS",
            instrument_name="USD 5Y pay fixed 3.90%",
            book="LN-RATES",
            counterparty="HELIOS",
            direction="PAY",
            notional=25_000_000,
            notional_currency="USD",
            fixed_rate=0.039,
            trade_date=date(2026, 9, 24),
            start_date=date(2026, 9, 29),
            maturity_date=date(2031, 9, 29),
            pay_frequency="6M",
            trader="A. Okonkwo",
            notes="Spot-starting payer. Waiting on confirmation.",
            history=[h(date(2026, 9, 24), "VERIFIED", "BOOKED", "VERIFIED", "Pay/receive and dates checked.")],
        ),
        dict(
            trade_ref="FT-1004",
            product_type="IRS",
            instrument_name="EUR 10Y receive fixed 2.40%",
            book="LN-RATES",
            counterparty="MARLOWE",
            direction="RECEIVE",
            notional=15_000_000,
            notional_currency="EUR",
            fixed_rate=0.024,
            trade_date=date(2026, 6, 15),
            start_date=date(2026, 9, 29),
            maturity_date=date(2036, 9, 29),
            pay_frequency="1Y",
            trader="A. Okonkwo",
            history=[
                h(date(2026, 6, 15), "VERIFIED", "BOOKED", "VERIFIED", "Curve and notional checked."),
                h(date(2026, 6, 16), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched."),
            ],
        ),
        dict(
            trade_ref="FT-1005",
            product_type="FX_SPOT",
            instrument_name="EURUSD spot buy 10mm",
            book="NY-FX",
            counterparty="PELLINORE",
            direction="BUY",
            notional=10_000_000,
            notional_currency="EUR",
            secondary_currency="USD",
            underlying="EURUSD",
            fixed_rate=1.0842,
            trade_date=VALUATION,
            start_date=date(2026, 9, 29),
            maturity_date=date(2026, 9, 29),
            trader="S. Pell",
            notes="Booked this morning. Still needs verification.",
            book_message="Voice ticket entered by S. Pell.",
        ),
        dict(
            trade_ref="FT-1006",
            product_type="FX_FORWARD",
            instrument_name="GBPUSD 3M forward sell",
            book="NY-FX",
            counterparty="NW-BANK",
            direction="SELL",
            notional=8_000_000,
            notional_currency="GBP",
            secondary_currency="USD",
            underlying="GBPUSD",
            fixed_rate=1.3155,
            trade_date=date(2026, 9, 18),
            start_date=date(2026, 9, 18),
            maturity_date=date(2026, 12, 29),
            trader="S. Pell",
            history=[
                h(date(2026, 9, 18), "VERIFIED", "BOOKED", "VERIFIED", "Outright checked against the points."),
                h(date(2026, 9, 19), "CONFIRMED", "VERIFIED", "CONFIRMED", "SWIFT-style confirmation matched. This demo does not send SWIFT."),
            ],
        ),
        dict(
            trade_ref="FT-1007",
            product_type="EQUITY_OPTION",
            instrument_name="AETHER Dec26 90 call",
            book="LN-EQD",
            counterparty="GREY",
            direction="BUY",
            notional=500,
            notional_currency="USD",
            underlying="AETHER",
            option_type="CALL",
            strike=90,
            premium=3.10,
            quantity=500,
            multiplier=100,
            trade_date=date(2026, 9, 22),
            start_date=date(2026, 9, 24),
            maturity_date=date(2026, 12, 18),
            trader="M. Cho",
            notes="Premium is per share. Contract multiplier is 100.",
            history=[h(date(2026, 9, 22), "VERIFIED", "BOOKED", "VERIFIED", "Strike, expiry, and premium checked.")],
        ),
        dict(
            trade_ref="FT-1008",
            product_type="EQUITY_OPTION",
            instrument_name="BRIGHTLINE Mar27 130 put",
            book="LN-EQD",
            counterparty="MARLOWE",
            direction="SELL",
            notional=200,
            notional_currency="USD",
            underlying="BRIGHTLINE",
            option_type="PUT",
            strike=130,
            premium=6.40,
            quantity=200,
            multiplier=100,
            trade_date=VALUATION,
            start_date=VALUATION,
            maturity_date=date(2027, 3, 19),
            trader="M. Cho",
            book_message="Sold today. Premium hits today's P&L as a new trade.",
        ),
        dict(
            trade_ref="FT-1009",
            product_type="FX_OPTION",
            instrument_name="EURUSD 3M 1.10 call",
            book="NY-FX",
            counterparty="HELIOS",
            direction="BUY",
            notional=20_000_000,
            notional_currency="EUR",
            secondary_currency="USD",
            underlying="EURUSD",
            option_type="CALL",
            strike=1.10,
            premium=0.0125,
            trade_date=date(2026, 9, 16),
            start_date=date(2026, 9, 18),
            maturity_date=date(2026, 12, 29),
            trader="S. Pell",
            notes="Premium is USD per EUR.",
            history=[
                h(date(2026, 9, 16), "VERIFIED", "BOOKED", "VERIFIED", "Notional and cut checked."),
                h(date(2026, 9, 17), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched."),
            ],
        ),
        dict(
            trade_ref="FT-1010",
            product_type="COMMODITY_SWAP",
            instrument_name="Brent swap pay 76.00",
            book="SG-ENRG",
            counterparty="CINDER",
            direction="PAY",
            notional=100_000,
            notional_currency="USD",
            underlying="BRENT",
            fixed_rate=76.0,
            trade_date=date(2026, 9, 10),
            start_date=date(2026, 10, 1),
            maturity_date=date(2027, 10, 1),
            pay_frequency="3M",
            trader="R. Iqbal",
            notes="Financial swap. Volume is barrels per quarter, not a cargo.",
            history=[h(date(2026, 9, 10), "VERIFIED", "BOOKED", "VERIFIED", "Volume and fixed price checked.")],
        ),
        dict(
            trade_ref="FT-1011",
            product_type="COMMODITY_FUTURE",
            instrument_name="Brent Dec26 future",
            book="SG-ENRG",
            counterparty="PELLINORE",
            direction="BUY",
            notional=40,
            notional_currency="USD",
            underlying="BRENT",
            fixed_rate=74.20,
            quantity=40,
            multiplier=1000,
            trade_date=date(2026, 9, 2),
            start_date=date(2026, 9, 2),
            maturity_date=date(2026, 12, 16),
            trader="R. Iqbal",
            history=[
                h(date(2026, 9, 2), "VERIFIED", "BOOKED", "VERIFIED", "Lots and contract month checked."),
                h(date(2026, 9, 2), "CONFIRMED", "VERIFIED", "CONFIRMED", "Exchange fill matched. No live exchange connection in this demo.", hour=16),
            ],
        ),
        dict(
            trade_ref="FT-1012",
            product_type="COMMODITY_SWAP",
            instrument_name="TTF swap receive 36.50",
            book="SG-ENRG",
            counterparty="CINDER",
            direction="RECEIVE",
            notional=25_000,
            notional_currency="EUR",
            underlying="TTF",
            fixed_rate=36.50,
            trade_date=VALUATION,
            start_date=date(2026, 10, 1),
            maturity_date=date(2027, 10, 1),
            pay_frequency="3M",
            trader="R. Iqbal",
            notes="Volume is MWh per quarter. Booked today.",
            book_message="New TTF swap, not yet verified.",
        ),
        dict(
            trade_ref="FT-1013",
            product_type="FX_FORWARD",
            instrument_name="USDJPY 3M forward buy",
            book="NY-FX",
            counterparty="ASH",
            direction="BUY",
            notional=12_000_000,
            notional_currency="USD",
            secondary_currency="JPY",
            underlying="USDJPY",
            fixed_rate=148.40,
            trade_date=date(2026, 9, 11),
            start_date=date(2026, 9, 11),
            maturity_date=date(2026, 12, 29),
            trader="S. Pell",
            history=[
                h(date(2026, 9, 11), "VERIFIED", "BOOKED", "VERIFIED", "Yen quotation checked."),
                h(date(2026, 9, 14), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched."),
            ],
        ),
        dict(
            trade_ref="FT-1014",
            product_type="FX_SPOT",
            instrument_name="EURUSD spot settled",
            book="NY-FX",
            counterparty="PELLINORE",
            direction="SELL",
            notional=4_000_000,
            notional_currency="EUR",
            secondary_currency="USD",
            underlying="EURUSD",
            fixed_rate=1.0790,
            trade_date=date(2026, 9, 21),
            start_date=date(2026, 9, 23),
            maturity_date=date(2026, 9, 23),
            trader="S. Pell",
            notes="Value date has passed, so the trade is off the open risk.",
            history=[
                h(date(2026, 9, 21), "VERIFIED", "BOOKED", "VERIFIED", "Checked."),
                h(date(2026, 9, 21), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmed.", hour=17),
                h(date(2026, 9, 23), "SETTLED", "CONFIRMED", "SETTLED", "Currencies exchanged.", actor="R. Iqbal"),
            ],
        ),
        dict(
            trade_ref="FT-1015",
            product_type="IRS",
            instrument_name="USD 10Y pay fixed 4.10% (cancelled)",
            book="LN-RATES",
            counterparty="GREY",
            direction="PAY",
            notional=10_000_000,
            notional_currency="USD",
            fixed_rate=0.041,
            trade_date=date(2026, 9, 20),
            start_date=date(2026, 9, 29),
            maturity_date=date(2036, 9, 29),
            pay_frequency="6M",
            trader="A. Okonkwo",
            notes="Cancelled before confirmation. Kept on the blotter so the audit trail is visible.",
            history=[
                h(date(2026, 9, 20), "VERIFIED", "BOOKED", "VERIFIED", "Checked."),
                h(date(2026, 9, 21), "CANCELLED", "VERIFIED", "CANCELLED", "Client pulled the order before confirmation.", actor="A. Okonkwo"),
            ],
        ),
        dict(
            trade_ref="FT-1016",
            product_type="BOND",
            instrument_name="Pellinore 5.00 01 Jun 2028",
            book="LN-TREAS",
            counterparty="PELLINORE",
            direction="SELL",
            notional=2_000_000,
            notional_currency="USD",
            fixed_rate=0.05,
            trade_date=date(2026, 8, 3),
            start_date=date(2024, 6, 1),
            maturity_date=date(2028, 6, 1),
            pay_frequency="6M",
            trader="L. Varga",
            notes="Short bond. Notional was amended, so the trade is back in Booked.",
            history=[
                h(date(2026, 8, 3), "VERIFIED", "BOOKED", "VERIFIED", "Short sale checked."),
                h(
                    date(2026, 9, 24),
                    "AMENDED",
                    "VERIFIED",
                    "BOOKED",
                    "Notional cut from 3,000,000 to 2,000,000. Needs to be verified again.",
                    payload={"changes": {"notional": {"from": 3_000_000, "to": 2_000_000}}},
                    actor="L. Varga",
                ),
            ],
        ),
        dict(
            trade_ref="FT-1017",
            product_type="COMMODITY_SWAP",
            instrument_name="API2 coal swap pay 115",
            book="SG-ENRG",
            counterparty="CINDER",
            direction="PAY",
            notional=20_000,
            notional_currency="USD",
            underlying="API2",
            fixed_rate=115.0,
            trade_date=date(2026, 8, 20),
            start_date=date(2026, 10, 1),
            maturity_date=date(2027, 10, 1),
            pay_frequency="3M",
            trader="R. Iqbal",
            notes="Tonnes per quarter.",
            history=[
                h(date(2026, 8, 20), "VERIFIED", "BOOKED", "VERIFIED", "Checked."),
                h(date(2026, 8, 21), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched."),
            ],
        ),
        dict(
            trade_ref="FT-1018",
            product_type="EQUITY_OPTION",
            instrument_name="CINDERCO Jan27 50 call",
            book="LN-EQD",
            counterparty="GREY",
            direction="BUY",
            notional=300,
            notional_currency="USD",
            underlying="CINDERCO",
            option_type="CALL",
            strike=50,
            premium=4.80,
            quantity=300,
            multiplier=100,
            trade_date=date(2026, 9, 8),
            start_date=date(2026, 9, 10),
            maturity_date=date(2027, 1, 15),
            trader="M. Cho",
            history=[
                h(date(2026, 9, 8), "VERIFIED", "BOOKED", "VERIFIED", "Checked."),
                h(date(2026, 9, 9), "CONFIRMED", "VERIFIED", "CONFIRMED", "Confirmation matched."),
            ],
        ),
    ]
    for spec in specs:
        _trade(db, books, parties, spec)
    seed_reference(db)
    db.commit()
