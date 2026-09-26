"""REST surface shaped like the public Orchestrade Web API subset this desk can run.

Paths, groups, and a few request ideas come from Derivitec's Orchestrade.Client
1.0.14, which was generated from an Orchestrade Swagger file. This is not that
API. Groups this demo does not price (credit curves, FRTB, SIMM, and the rest)
are named in the README and are not implemented.
"""

from __future__ import annotations

import secrets
from contextlib import contextmanager
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session, joinedload

from app.analytics import (
    cashflow_ladder,
    pnl_report,
    positions_report,
    price_book,
    reset_trade_ids,
    risk_table,
    stress_report,
    summary,
    use_trade_ids,
    var_report,
)
from app.db import Base, get_db, get_engine, session_local
from app.lifecycle import LifecycleError, begin_amendment, record_event, snapshot, transition, utcnow
from app.marketdata import clear_curve_cache, load_market, valuation_date
from app.prefix import PUBLIC_PREFIX
from app.models import (
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
    FxSpot,
    FxVol,
    PricingSetupRow,
    RateIndex,
    SavedFilter,
    Trade,
    TradeEvent,
)
from app.pricing import PricingError, price_trade, view_from_model
from app.schemas import (
    BookIn,
    CsaIn,
    FilterIn,
    PartyIn,
    SaveCommodityCurveIn,
    SaveInterestCurveIn,
    SaveQuotesIn,
    TaskPut,
    TradeIn,
    TradePut,
)
from app.seed import seed
from app.validation import ValidationError, validate_trade
from app.wire import (
    book_out,
    calendar_out,
    closing_name,
    commodity_curve_out,
    criteria_for,
    csa_out,
    currency_out,
    event_out,
    interest_curve_out,
    load_filter,
    matching_ids,
    matches,
    pair_out,
    party_out,
    pascalize,
    public_errors,
    quotes_for,
    setup_out,
    trade_out,
    trade_query,
    unique_trades,
)

security = HTTPBasic(auto_error=False)
api = APIRouter(prefix=f"{PUBLIC_PREFIX}/api")
monitoring = APIRouter(prefix=PUBLIC_PREFIX)

REPORTS = {
    "PLReport": "Daily P&L explain.",
    "VaRReport": "One-day historical and parametric VaR.",
    "ScenarioReport": "Full-revaluation stress scenarios.",
    "CashFlowReport": "Settlement ladder.",
}
NAMED_ONLY = [
    "AnalysisReport",
    "PlGreekReport",
    "VaRBacktestingAnalysisReport",
    "FxExposureReport",
    "FrtbReport",
    "SimmIsdaReport",
    "CreditLimitReport",
    "FactorAnalysisReport",
    "MonteCarloAnalysisReport",
    "HedgeEffectivenessReport",
    "ResetReport",
    "RiskPremiumReport",
    "IndustrialValuationReport",
]
EVENT_CATALOG = [
    "AmendEvent",
    "SettlementEvent",
    "TerminationEvent",
    "NovationEvent",
    "PartialNovationEvent",
    "ExerciseEvent",
    "ExpiryEvent",
    "MaturityEvent",
    "ClearingStatusEvent",
    "TradeClearingEvent",
    "CorporateActionEvent",
    "FixingEvent",
    "RolloverEvent",
]


def require_user(
    credentials: HTTPBasicCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> DeskUser:
    """HTTP Basic, the scheme the Derivitec client documents. Classroom passwords are not hashed."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Sign in with HTTP Basic.", headers={"WWW-Authenticate": "Basic"})
    user = db.get(DeskUser, credentials.username)
    if user is None or not secrets.compare_digest(user.password, credentials.password):
        raise HTTPException(status_code=401, detail="Unknown username or password.", headers={"WWW-Authenticate": "Basic"})
    return user


def _user_out(user: DeskUser) -> dict:
    return {"Username": user.username, "DisplayName": user.display_name, "Role": user.role}


@contextmanager
def _scoped(db: Session, filter_name: str | None, book: str | None):
    token = use_trade_ids(matching_ids(db, filter_name, book))
    try:
        yield
    finally:
        reset_trade_ids(token)


def _fail_validation(exc: ValidationError) -> None:
    raise HTTPException(status_code=400, detail=public_errors(exc.errors))


def _book(db: Session, code: str) -> Book:
    row = db.query(Book).filter(Book.code == code).one_or_none()
    if row is None or not row.active:
        raise HTTPException(status_code=400, detail=[{"field": "Book", "message": f"Unknown or inactive book '{code}'."}])
    return row


def _party(db: Session, code: str) -> Counterparty:
    row = db.query(Counterparty).filter(Counterparty.code == code).one_or_none()
    if row is None or not row.active:
        raise HTTPException(status_code=400, detail=[{"field": "Party", "message": f"Unknown or inactive party '{code}'."}])
    return row


def _checked(db: Session, payload: TradeIn) -> None:
    try:
        validate_trade(payload, load_market(db, valuation_date(db)), valuation_date(db))
    except ValidationError as exc:
        _fail_validation(exc)


def _apply(trade: Trade, payload: TradeIn, book: Book, party: Counterparty) -> None:
    trade.product_type = payload.product_type
    trade.instrument_name = payload.instrument_name.strip()
    trade.book_id = book.id
    trade.counterparty_id = party.id
    trade.direction = payload.direction
    trade.notional = payload.notional
    trade.notional_currency = payload.notional_currency
    trade.secondary_currency = payload.secondary_currency
    trade.fixed_rate = payload.fixed_rate
    trade.strike = payload.strike
    trade.premium = payload.premium
    trade.quantity = payload.quantity
    trade.multiplier = payload.multiplier
    trade.underlying = payload.underlying
    trade.option_type = payload.option_type
    trade.trade_date = payload.trade_date
    trade.start_date = payload.start_date
    trade.maturity_date = payload.maturity_date
    trade.pay_frequency = payload.pay_frequency or "6M"
    trade.trader = payload.trader or "desk"
    trade.notes = payload.notes or ""


def _next_ref(db: Session) -> str:
    nums = []
    for (ref,) in db.query(Trade.trade_ref):
        try:
            nums.append(int(str(ref).split("-")[1]))
        except (IndexError, ValueError):
            continue
    return f"FT-{(max(nums) if nums else 1000) + 1}"


def _save_new(db: Session, payload: TradeIn, actor: str) -> Trade:
    _checked(db, payload)
    book = _book(db, payload.book)
    party = _party(db, payload.counterparty)
    now = utcnow()
    trade = Trade(
        trade_ref=_next_ref(db),
        status="BOOKED",
        created_at=now,
        updated_at=now,
        product_type=payload.product_type,
        instrument_name=payload.instrument_name.strip(),
        book_id=book.id,
        counterparty_id=party.id,
        direction=payload.direction,
        notional=payload.notional,
        notional_currency=payload.notional_currency,
        secondary_currency=payload.secondary_currency,
        fixed_rate=payload.fixed_rate,
        strike=payload.strike,
        premium=payload.premium,
        quantity=payload.quantity,
        multiplier=payload.multiplier,
        underlying=payload.underlying,
        option_type=payload.option_type,
        trade_date=payload.trade_date,
        start_date=payload.start_date,
        maturity_date=payload.maturity_date,
        pay_frequency=payload.pay_frequency or "6M",
        trader=payload.trader or actor,
        notes=payload.notes or "",
    )
    db.add(trade)
    db.flush()
    db.add(record_event(trade, "Booked", None, "BOOKED", actor, "Booked from the ticket."))
    db.commit()
    return trade_query(db).filter(Trade.id == trade.id).one()


def _as_trade_in(body: TradePut) -> TradeIn:
    required = {
        "ProductType": body.product_type,
        "Product": body.instrument_name,
        "Book": body.book,
        "Party": body.counterparty,
        "Direction": body.direction,
        "Notional": body.notional,
        "SettleCurrency": body.notional_currency,
        "TradeTime": body.trade_date,
        "SettlementDate": body.start_date,
        "Maturity": body.maturity_date,
    }
    missing = [name for name, value in required.items() if value is None]
    if missing:
        raise HTTPException(status_code=400, detail=f"An amendment needs {', '.join(missing)}.")
    return TradeIn(
        product_type=body.product_type,
        instrument_name=body.instrument_name or "",
        book=body.book or "",
        counterparty=body.counterparty or "",
        direction=body.direction or "",
        notional=body.notional or 0,
        notional_currency=body.notional_currency or "",
        secondary_currency=body.secondary_currency,
        fixed_rate=body.fixed_rate,
        strike=body.strike,
        premium=body.premium,
        quantity=body.quantity,
        multiplier=body.multiplier,
        underlying=body.underlying,
        option_type=body.option_type,
        trade_date=body.trade_date,
        start_date=body.start_date,
        maturity_date=body.maturity_date,
        pay_frequency=body.pay_frequency or "6M",
        trader=body.trader or "desk",
        notes=body.notes or "",
    )


def _price_dict(result) -> dict:
    return {
        "pv": result.pv,
        "pv_currency": result.pv_currency,
        "pv_usd": result.pv_usd,
        "model": result.model,
        "explanation": result.explanation,
        "measures": result.measures,
        "inputs": result.inputs,
        "cashflows": result.cashflows,
    }


def _setup(db: Session, name: str) -> PricingSetupRow:
    row = db.get(PricingSetupRow, name)
    if row is None:
        raise HTTPException(status_code=404, detail=f"Unknown pricing setup '{name}'.")
    return row


def _market_for_setup(db: Session, name: str):
    row = _setup(db, name)
    as_of = date.fromisoformat(row.closing_name.removeprefix("EOD-"))
    return load_market(db, as_of), row


# --- Monitoring (no Basic auth; the Derivitec paths sit outside /api) ---


@monitoring.get("/Monitoring/Ping", tags=["Monitoring"])
def ping(db: Session = Depends(get_db)) -> dict:
    """Liveness and the lesson valuation date. Classroom HTTP Basic is not required. The umbrella Google session is."""
    return {"Status": "ok", "Service": "fathom-desk", "ValuationDate": valuation_date(db).isoformat()}


# --- User ---


@api.get("/User/Login", tags=["User"])
def login(user: DeskUser = Depends(require_user)) -> dict:
    """Check HTTP Basic and return the signed-in user. Mirrors GET /api/User/Login."""
    return _user_out(user)


@api.get("/User/GetUser", tags=["User"])
def get_user(user: DeskUser = Depends(require_user)) -> dict:
    """The user on this request. Mirrors GET /api/User/GetUser."""
    return _user_out(user)


# --- Trades ---


@api.get("/Trades", tags=["Trades"])
def list_trades(
    filter: str | None = Query(default=None, description="Saved filter name, for example NeedsVerification."),
    book: str | None = Query(default=None, description="Extra Book In criterion. The real call passes a filter object."),
    q: str | None = Query(default=None, description="Demo convenience: substring on reference, product, or party."),
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Load trades with a filter. Mirrors GET /api/Trades."""
    criteria = criteria_for(db, filter, book)
    rows = []
    for trade in unique_trades(trade_query(db).order_by(Trade.id).all()):
        if criteria and not matches(trade, criteria):
            continue
        if q:
            haystack = f"{trade.trade_ref} {trade.instrument_name} {trade.counterparty.code} {trade.counterparty.name}".lower()
            if q.lower() not in haystack:
                continue
        rows.append(trade_out(trade))
    return {"Trades": rows, "Count": len(rows), "FilterName": filter}


@api.get("/Trades/{trade_id}", tags=["Trades"])
def get_trade(trade_id: int, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Find a trade by id, including its event history. Mirrors GET /api/Trades/{id}."""
    trade = trade_query(db).filter(Trade.id == trade_id).one_or_none()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found.")
    return trade_out(trade, with_events=True)


@api.post("/Trades", tags=["Trades"], status_code=201)
def create_trade(payload: TradeIn, db: Session = Depends(get_db), user: DeskUser = Depends(require_user)) -> dict:
    """Save a new trade. It starts Booked. Mirrors POST /api/Trades."""
    return trade_out(_save_new(db, payload, user.username), with_events=True)


@api.post("/Trades/FillAndSaveTrade", tags=["Trades"], status_code=201)
def fill_and_save(payload: TradeIn, db: Session = Depends(get_db), user: DeskUser = Depends(require_user)) -> dict:
    """Fill a trade from the caller's document and save it. Mirrors POST /api/Trades/FillAndSaveTrade.

    A real template provider would complete missing product fields. This demo still validates the ticket you send.
    """
    if not payload.trader:
        payload.trader = user.username
    return trade_out(_save_new(db, payload, user.username), with_events=True)


@api.put("/Trades", tags=["Trades"])
def update_trade(body: TradePut, db: Session = Depends(get_db), user: DeskUser = Depends(require_user)) -> dict:
    """Update a trade. An Action is the teaching workflow. No Action is an amendment.

    Mirrors PUT /api/Trades. The Derivitec description says that when no workflow action is passed, the operation is an amendment.
    Settlement writes SettlementEvent. Cancel writes TerminationEvent. Amend writes AmendEvent.
    NovationEvent, ExerciseEvent, and clearing events are in the real model and are not implemented.
    """
    trade = trade_query(db).filter(Trade.id == body.id).one_or_none()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found.")
    if body.action:
        try:
            event = transition(trade, body.action, user.username, body.message)
        except LifecycleError as exc:
            raise HTTPException(status_code=409, detail=exc.message) from exc
        db.add(event)
        db.commit()
        return trade_out(trade_query(db).filter(Trade.id == body.id).one(), with_events=True)
    payload = _as_trade_in(body)
    _checked(db, payload)
    book = _book(db, payload.book)
    party = _party(db, payload.counterparty)
    before = snapshot(trade)
    try:
        _apply(trade, payload, book, party)
        event = begin_amendment(trade, user.username, before, snapshot(trade), body.message)
    except LifecycleError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=exc.message) from exc
    db.add(event)
    db.commit()
    return trade_out(trade_query(db).filter(Trade.id == body.id).one(), with_events=True)


@api.get("/Trades/{trade_id}/Events", tags=["Trades"])
def list_events(trade_id: int, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Event history. The real trade carries LastEventType; this list is the demo's audit trail.

    Implemented event types: Booked, Verified, Confirmed, AmendEvent, SettlementEvent, TerminationEvent.
    Named in the real model and not implemented here: """ + ", ".join(EVENT_CATALOG[3:]) + "."
    trade = db.get(Trade, trade_id)
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found.")
    events = db.query(TradeEvent).filter(TradeEvent.trade_id == trade_id).order_by(TradeEvent.id).all()
    return {
        "TradingSystemReference": trade.trade_ref,
        "Status": trade.status,
        "LastEventType": events[-1].event_type if events else None,
        "Events": [event_out(event) for event in events],
    }


# --- Position ---


@api.get("/Position/LoadPositionsFromFilter", tags=["Position"])
def load_positions(
    portfolioDate: str | None = None,
    pricingSetupName: str = "Official",
    filter: str | None = None,
    book: str | None = None,
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Positions for a portfolio date and pricing setup. Mirrors GET /api/Position/LoadPositionsFromFilter."""
    _setup(db, pricingSetupName)
    with _scoped(db, filter, book):
        body = positions_report(db, None)
    return {
        "PortfolioDate": portfolioDate or body["valuation_date"],
        "PricingSetupName": pricingSetupName,
        "FilterName": filter,
        **pascalize(body),
    }


@api.get("/Position/LoadTradesAndPositionsFromFilter", tags=["Position"])
def load_trades_and_positions(
    portfolioDate: str | None = None,
    pricingSetupName: str = "Official",
    filter: str | None = None,
    book: str | None = None,
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Trades and positions together. Mirrors GET /api/Position/LoadTradesAndPositionsFromFilter.

    Each trade includes a Valuation block so the pricing screen can show the model. The real payload is larger.
    """
    market, _row = _market_for_setup(db, pricingSetupName)
    with _scoped(db, filter, book):
        positions = positions_report(db, None)
        priced = price_book(db, None, market)
    by_id = {row["trade_id"]: row for row in priced}
    allowed = matching_ids(db, filter, book)
    trades = []
    for trade in unique_trades(trade_query(db).order_by(Trade.id).all()):
        if allowed is not None and trade.id not in allowed:
            continue
        trades.append(trade_out(trade, valuation=by_id.get(trade.id)))
    return {
        "PortfolioDate": portfolioDate or market.as_of.isoformat(),
        "PricingSetupName": pricingSetupName,
        "FilterName": filter,
        "Trades": trades,
        "Positions": pascalize(positions["rows"]),
        "CurrencyPosition": pascalize(positions["currency_position"]),
        "PvUsd": positions["pv_usd"],
    }


# --- Pricing ---


@api.get("/Pricing/GetTradePriceFromTradeId", tags=["Pricing"])
def price_from_id(
    tradeId: int,
    pricingSetupName: str = "Official",
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Price a saved trade. Mirrors GET /api/Pricing/GetTradePriceFromTradeId."""
    trade = trade_query(db).filter(Trade.id == tradeId).one_or_none()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found.")
    market, row = _market_for_setup(db, pricingSetupName)
    try:
        result = price_trade(view_from_model(trade), market)
    except PricingError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    return {
        "TradeId": trade.id,
        "TradingSystemReference": trade.trade_ref,
        "Product": trade.instrument_name,
        "PricingSetupName": row.name,
        "ClosingName": row.closing_name,
        **pascalize(_price_dict(result)),
    }


@api.post("/Pricing/GetTradePriceFromTradeJson", tags=["Pricing"])
def price_from_json(payload: TradeIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Price a ticket that is not saved.

    The Derivitec method is GET GetTradePriceFromTradeJson. This demo accepts POST so the trade document is a JSON body.
    """
    _checked(db, payload)
    market = load_market(db, valuation_date(db))
    draft = Trade(
        trade_ref="DRAFT",
        status="BOOKED",
        product_type=payload.product_type,
        instrument_name=payload.instrument_name,
        direction=payload.direction,
        notional=payload.notional,
        notional_currency=payload.notional_currency,
        secondary_currency=payload.secondary_currency,
        fixed_rate=payload.fixed_rate,
        strike=payload.strike,
        premium=payload.premium,
        quantity=payload.quantity,
        multiplier=payload.multiplier,
        underlying=payload.underlying,
        option_type=payload.option_type,
        trade_date=payload.trade_date,
        start_date=payload.start_date,
        maturity_date=payload.maturity_date,
        pay_frequency=payload.pay_frequency or "6M",
        created_at=utcnow(),
        updated_at=utcnow(),
        book_id=1,
        counterparty_id=1,
    )
    try:
        result = price_trade(view_from_model(draft), market)
    except PricingError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    return {"PricingSetupName": "Official", **pascalize(_price_dict(result))}


# --- Risk and reports ---


@api.get("/Risk/AnalysisReport", tags=["Risk"])
def analysis_report(
    analysisName: str = "Sensitivities",
    analysisConfigName: str = "Default",
    filter: str | None = None,
    pricingSetupName: str = "Official",
    book: str | None = None,
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Mirrors GET /api/Risk/AnalysisReport.

    analysisName=Sensitivities is DV01, key-rate buckets, delta, and vega.
    analysisName=Desk is this demo's cockpit (open value, day P&L, VaR). That name is not a published Orchestrade analysis.
    """
    _setup(db, pricingSetupName)
    with _scoped(db, filter, book):
        if analysisName == "Desk":
            body = summary(db, None)
            payload = pascalize(body)
        elif analysisName == "Sensitivities":
            payload = pascalize(risk_table(db, None))
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Unknown analysis '{analysisName}'. This demo runs Sensitivities and Desk.",
            )
    return {
        "AnalysisName": analysisName,
        "AnalysisConfigName": analysisConfigName,
        "FilterName": filter,
        "PricingSetupName": pricingSetupName,
        "ValuationTime": valuation_date(db).isoformat(),
        **payload,
    }


@api.get("/Report/{report_type}/{user_config}", tags=["Report"])
def report(
    report_type: str,
    user_config: str,
    filter: str | None = None,
    book: str | None = None,
    pricingSetupName: str = "Official",
    rateBp: float = 0,
    usdStrengthPct: float = 0,
    equityPct: float = 0,
    volPoints: float = 0,
    commodityPct: float = 0,
    name: str = "Custom",
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Mirrors GET /api/Report/{report_type}/{user_config}.

    Implemented: PLReport, VaRReport, ScenarioReport, CashFlowReport.
    ScenarioReport with user_config Custom applies the query-string shock.
    FRTB, SIMM, and the other named report types are not built.
    """
    if report_type in NAMED_ONLY:
        raise HTTPException(
            status_code=404,
            detail=f"{report_type} is a real report type in the Derivitec model and is not implemented in this demo. Built reports: {', '.join(REPORTS)}.",
        )
    if report_type not in REPORTS:
        raise HTTPException(status_code=404, detail=f"Unknown report type '{report_type}'.")
    _setup(db, pricingSetupName)
    with _scoped(db, filter, book):
        if report_type == "PLReport":
            body = pnl_report(db, None)
        elif report_type == "VaRReport":
            body = var_report(db, None)
        elif report_type == "CashFlowReport":
            body = cashflow_ladder(db, None)
        elif user_config == "Custom":
            body = stress_report(
                db,
                None,
                extra={
                    "id": "custom",
                    "name": name,
                    "rate_bp": rateBp,
                    "usd_strength_pct": usdStrengthPct,
                    "equity_pct": equityPct,
                    "vol_points": volPoints,
                    "commodity_pct": commodityPct,
                },
            )
        else:
            body = stress_report(db, None)
    return {
        "ReportType": report_type,
        "UserConfig": user_config,
        "PricingSetupName": pricingSetupName,
        "FilterName": filter,
        "Description": REPORTS[report_type],
        **pascalize(body),
    }


# --- Market: quotes and curves ---


@api.get("/Quote/GetQuotesForClosings", tags=["Quote"])
def quotes_for_closing(
    closingName: str | None = None,
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Quotes in one closing. Mirrors GET /api/Quote/GetQuotesForClosings, for a single closing name."""
    as_of = valuation_date(db) if not closingName else date.fromisoformat(closingName.removeprefix("EOD-"))
    return {"ClosingName": closing_name(as_of), "Quotes": quotes_for(db, as_of)}


@api.get("/Quote/GetMostRecentQuote", tags=["Quote"])
def most_recent_quote(
    quoteName: str,
    closingName: str | None = None,
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """One quote by name. Mirrors GET /api/Quote/GetMostRecentQuote."""
    as_of = valuation_date(db) if not closingName else date.fromisoformat(closingName.removeprefix("EOD-"))
    for quote in quotes_for(db, as_of):
        if quote["QuoteName"] == quoteName:
            return {"ClosingName": closing_name(as_of), **quote}
    raise HTTPException(status_code=404, detail=f"No quote named {quoteName}.")


@api.post("/Quote/SaveQuotes", tags=["Quote"])
def save_quotes(body: SaveQuotesIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Save a list of quotes into today's closing. Yesterday stays frozen. Mirrors POST /api/Quote/SaveQuotes."""
    as_of = valuation_date(db)
    if body.ClosingName != closing_name(as_of):
        raise HTTPException(status_code=400, detail=f"Only {closing_name(as_of)} can be edited. Yesterday's close is frozen.")
    for quote in body.Quotes:
        name = quote.QuoteName
        parts = name.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail=f"Quote name {name} should look like FX.EURUSD.SPOT.")
        kind, symbol, field = parts
        if kind == "FX" and field == "SPOT":
            row = db.query(FxSpot).filter(FxSpot.as_of == as_of, FxSpot.pair == symbol).one_or_none()
            if row is None or quote.Value <= 0:
                raise HTTPException(status_code=400, detail=f"Bad FX spot {name}.")
            row.spot = quote.Value
        elif kind == "FX" and field == "VOL":
            row = db.query(FxVol).filter(FxVol.as_of == as_of, FxVol.pair == symbol).one_or_none()
            if row is None or not 0 < quote.Value < 2:
                raise HTTPException(status_code=400, detail=f"Bad FX vol {name}.")
            row.vol = quote.Value
        elif kind == "EQ" and field in {"SPOT", "VOL", "DIV"}:
            row = db.query(EquityQuote).filter(EquityQuote.as_of == as_of, EquityQuote.ticker == symbol).one_or_none()
            if row is None:
                raise HTTPException(status_code=400, detail=f"Unknown equity quote {name}.")
            if field == "SPOT":
                if quote.Value <= 0:
                    raise HTTPException(status_code=400, detail=f"{name} must be positive.")
                row.spot = quote.Value
            elif field == "VOL":
                if not 0 < quote.Value < 3:
                    raise HTTPException(status_code=400, detail=f"{name} vol is out of range.")
                row.vol = quote.Value
            else:
                if quote.Value < -0.05 or quote.Value > 0.2:
                    raise HTTPException(status_code=400, detail=f"{name} dividend is out of range.")
                row.dividend_yield = quote.Value
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported quote {name}.")
    db.commit()
    clear_curve_cache()
    return {"ClosingName": body.ClosingName, "Quotes": quotes_for(db, as_of)}


@api.get("/QuoteName/GetQuoteNames", tags=["QuoteName"])
def quote_names(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Quote name catalog for today's closing. Mirrors GET /api/QuoteName/GetQuoteNames in spirit."""
    as_of = valuation_date(db)
    return {"QuoteNames": [row["QuoteName"] for row in quotes_for(db, as_of)]}


@api.get("/InterestCurve/GetMostRecentInterestCurve", tags=["InterestCurve"])
def get_interest_curve(
    currency: str,
    name: str | None = None,
    setupName: str = "Official",
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Mirrors GET /api/InterestCurve/GetMostRecentInterestCurve. One discount curve per currency."""
    row = _setup(db, setupName)
    as_of = date.fromisoformat(row.closing_name.removeprefix("EOD-"))
    curve_name = name or f"{currency}-DISC"
    body = interest_curve_out(db, as_of, currency, curve_name, setupName)
    if not body["Pillars"]:
        raise HTTPException(status_code=404, detail=f"No interest curve for {currency}.")
    return body


@api.post("/InterestCurve/SaveInterestCurve", tags=["InterestCurve"])
def save_interest_curve(body: SaveInterestCurveIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Replace today's pillars for one currency. Mirrors POST /api/InterestCurve/SaveInterestCurve."""
    if body.SetupName != "Official":
        raise HTTPException(status_code=400, detail="Only the Official setup can be edited.")
    if not body.Pillars:
        raise HTTPException(status_code=400, detail=f"{body.Currency} curve has no pillars.")
    as_of = valuation_date(db)
    for pillar in body.Pillars:
        if not -0.02 <= pillar.Rate <= 0.30:
            raise HTTPException(status_code=400, detail=f"{body.Currency} {pillar.Tenor} rate {pillar.Rate} is outside -2% to 30%.")
        if pillar.Instrument not in {"deposit", "swap"}:
            raise HTTPException(status_code=400, detail="Instrument must be deposit or swap.")
    db.query(CurvePillar).filter(CurvePillar.as_of == as_of, CurvePillar.currency == body.Currency).delete()
    for pillar in body.Pillars:
        db.add(CurvePillar(as_of=as_of, currency=body.Currency, tenor=pillar.Tenor, pillar_type=pillar.Instrument, rate=pillar.Rate))
    db.commit()
    clear_curve_cache()
    return interest_curve_out(db, as_of, body.Currency, body.Name, body.SetupName)


@api.get("/CommodityCurve/GetMostRecentCommodityCurve", tags=["CommodityCurve"])
def get_commodity_curve(
    commodityId: str,
    curveName: str | None = None,
    setupName: str = "Official",
    db: Session = Depends(get_db),
    _user: DeskUser = Depends(require_user),
) -> dict:
    """Mirrors GET /api/CommodityCurve/GetMostRecentCommodityCurve."""
    row = _setup(db, setupName)
    as_of = date.fromisoformat(row.closing_name.removeprefix("EOD-"))
    return commodity_curve_out(db, as_of, commodityId, setupName)


@api.post("/CommodityCurve/SaveCommodityCurve", tags=["CommodityCurve"])
def save_commodity_curve(body: SaveCommodityCurveIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Replace today's commodity forwards. Mirrors POST /api/CommodityCurve/SaveCommodityCurve."""
    if body.SetupName != "Official":
        raise HTTPException(status_code=400, detail="Only the Official setup can be edited.")
    as_of = valuation_date(db)
    existing = db.query(CommodityForward).filter(CommodityForward.as_of == as_of, CommodityForward.underlying == body.CommodityId).all()
    if not existing:
        raise HTTPException(status_code=400, detail=f"Unknown commodity {body.CommodityId}.")
    meta = existing[0]
    for pillar in body.Pillars:
        if pillar.Price <= 0:
            raise HTTPException(status_code=400, detail=f"{body.CommodityId} {pillar.Tenor} price must be positive.")
    db.query(CommodityForward).filter(CommodityForward.as_of == as_of, CommodityForward.underlying == body.CommodityId).delete()
    for pillar in body.Pillars:
        db.add(
            CommodityForward(
                as_of=as_of,
                underlying=body.CommodityId,
                name=meta.name,
                tenor=pillar.Tenor,
                price=pillar.Price,
                currency=meta.currency,
                unit=meta.unit,
            )
        )
    db.commit()
    clear_curve_cache()
    return commodity_curve_out(db, as_of, body.CommodityId, body.SetupName)


# --- Reference data ---


@api.get("/Party/Property", tags=["Party"])
def parties(role: str | None = None, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Parties, optionally by role. Mirrors GET /api/Party/Property."""
    rows = db.query(Counterparty).order_by(Counterparty.code).all()
    if role:
        rows = [row for row in rows if row.role.lower() == role.lower()]
    return {"Parties": [party_out(row) for row in rows]}


@api.get("/Party/Code/{code}", tags=["Party"])
def party_by_code(code: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Find a party by code. Mirrors GET /api/Party/Code/{code}."""
    row = db.query(Counterparty).filter(Counterparty.code == code).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Party not found.")
    return party_out(row)


@api.get("/Party/{party_id}", tags=["Party"])
def party_by_id(party_id: int, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Find a party by id. Mirrors GET /api/Party/{partyId}."""
    row = db.get(Counterparty, party_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Party not found.")
    return party_out(row)


@api.post("/Party", tags=["Party"], status_code=201)
def save_party(body: PartyIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Save a party. An existing code is updated. Mirrors POST /api/Party."""
    code = body.Code.strip().upper()
    if not code or not body.Name.strip():
        raise HTTPException(status_code=400, detail="Code and name are required.")
    row = db.query(Counterparty).filter(Counterparty.code == code).one_or_none()
    if row is None:
        row = Counterparty(code=code, name=body.Name.strip(), role=body.Role, city=body.City, active=1 if body.Active else 0)
        db.add(row)
    else:
        row.name = body.Name.strip()
        row.role = body.Role
        row.city = body.City
        row.active = 1 if body.Active else 0
    db.commit()
    db.refresh(row)
    return party_out(row)


@api.get("/Book/All", tags=["Book"])
def list_books(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Books used as a filter element.

    Not one of the 34 groups. Derivitec's notes say books are read through PartyApi. This desk lists them here so the static screen can add one.
    """
    rows = db.query(Book).order_by(Book.code).all()
    return {"Books": [book_out(row) for row in rows]}


@api.post("/Book", tags=["Book"], status_code=201)
def save_book(body: BookIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Create or update a book. Same caveat as GET /api/Book/All: this path is not in the Derivitec snapshot."""
    code = body.Code.strip().upper()
    if body.BaseCurrency not in {"USD", "EUR", "GBP", "JPY"}:
        raise HTTPException(status_code=400, detail="Base currency must be USD, EUR, GBP, or JPY.")
    if not code or not body.Name.strip():
        raise HTTPException(status_code=400, detail="Code and name are required.")
    row = db.query(Book).filter(Book.code == code).one_or_none()
    if row is None:
        row = Book(code=code, name=body.Name.strip(), desk=body.Desk.strip(), base_currency=body.BaseCurrency, active=1 if body.Active else 0)
        db.add(row)
    else:
        row.name = body.Name.strip()
        row.desk = body.Desk.strip()
        row.base_currency = body.BaseCurrency
        row.active = 1 if body.Active else 0
    db.commit()
    db.refresh(row)
    return book_out(row)


@api.get("/Currency/All", tags=["Currency"])
def list_currencies(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Currency/All."""
    rows = db.query(Currency).order_by(Currency.code).all()
    return {"Currencies": [currency_out(row) for row in rows]}


@api.get("/Currency/{iso_code}", tags=["Currency"])
def currency_by_code(iso_code: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Currency/{isoCode}."""
    row = db.get(Currency, iso_code.upper())
    if row is None:
        raise HTTPException(status_code=404, detail="Currency not found.")
    return currency_out(row)


@api.get("/CurrencyPair/All", tags=["CurrencyPair"])
def list_pairs(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/CurrencyPair/All."""
    rows = db.query(CurrencyPair).order_by(CurrencyPair.name).all()
    return {"CurrencyPairs": [pair_out(row) for row in rows]}


@api.get("/Calendar/All", tags=["Calendar"])
def list_calendars(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Calendar/All."""
    rows = db.query(Calendar).options(joinedload(Calendar.holidays)).order_by(Calendar.code).all()
    return {"Calendars": [calendar_out(row) for row in rows]}


@api.get("/Calendar/Name/{name}", tags=["Calendar"])
def calendar_by_name(name: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Calendar/Name/{name}. The name is the calendar code, such as NYC."""
    row = db.query(Calendar).options(joinedload(Calendar.holidays)).filter(Calendar.code == name).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Calendar not found.")
    return calendar_out(row)


@api.get("/CsaAgreement/All", tags=["CsaAgreement"])
def list_csas(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/CsaAgreement/All. These agreements are not used in pricing."""
    rows = db.query(CsaAgreement).order_by(CsaAgreement.name).all()
    return {"CsaAgreements": [csa_out(row) for row in rows]}


@api.get("/CsaAgreement/Name/{name}", tags=["CsaAgreement"])
def csa_by_name(name: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/CsaAgreement/Name/{name}."""
    row = db.query(CsaAgreement).filter(CsaAgreement.name == name).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="CSA agreement not found.")
    return csa_out(row)


@api.post("/CsaAgreement", tags=["CsaAgreement"], status_code=201)
def save_csa(body: CsaIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Save a CSA agreement. Mirrors POST /api/CsaAgreement. Collateral is not calculated."""
    if db.query(Counterparty).filter(Counterparty.code == body.Party).one_or_none() is None:
        raise HTTPException(status_code=400, detail=f"Unknown party {body.Party}.")
    row = db.query(CsaAgreement).filter(CsaAgreement.name == body.Name).one_or_none()
    if row is None:
        row = CsaAgreement(
            name=body.Name,
            party_code=body.Party,
            currency=body.Currency,
            threshold=body.Threshold,
            independent_amount=body.IndependentAmount,
            active=1,
        )
        db.add(row)
    else:
        row.party_code = body.Party
        row.currency = body.Currency
        row.threshold = body.Threshold
        row.independent_amount = body.IndependentAmount
    db.commit()
    db.refresh(row)
    return csa_out(row)


@api.get("/RateIndex/All", tags=["RateIndex"])
def list_indexes(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/RateIndex/All. The swap pricer uses a 6M index convention, not these rows, as fixings."""
    rows = db.query(RateIndex).order_by(RateIndex.currency).all()
    return {"RateIndexes": [{"Currency": row.currency, "Name": row.name, "Tenor": row.tenor} for row in rows]}


@api.get("/PricingSetup/All", tags=["PricingSetup"])
def list_setups(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/PricingSetup/All."""
    rows = db.query(PricingSetupRow).order_by(PricingSetupRow.name).all()
    return {"PricingSetups": [setup_out(row) for row in rows]}


@api.get("/PricingSetup/GetPricingSetup", tags=["PricingSetup"])
def get_setup(name: str = "Official", db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/PricingSetup/GetPricingSetup."""
    return setup_out(_setup(db, name))


@api.get("/Filter/GetAllFilters", tags=["Filter"])
def all_filters(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Filter/GetAllFilters."""
    rows = db.query(SavedFilter).order_by(SavedFilter.name).all()
    return {"Filters": [_filter_out(row) for row in rows]}


@api.get("/Filter/GetFilter", tags=["Filter"])
def get_filter(name: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Filter/GetFilter."""
    return _filter_out(load_filter(db, name))


@api.post("/Filter/SaveFilter", tags=["Filter"], status_code=201)
def save_filter(body: FilterIn, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors POST /api/Filter/SaveFilter. Conditions used here: In, NotIn, Like, Before, After."""
    allowed = {"In", "NotIn", "Like", "Before", "After"}
    elements = {"Book", "Party", "TradeStatus", "ProductType", "Trader", "MaturityDate"}
    for item in body.CriteriaList:
        if item.ElementCondition not in allowed:
            raise HTTPException(status_code=400, detail=f"Condition {item.ElementCondition} is not implemented.")
        if item.ElementType not in elements:
            raise HTTPException(status_code=400, detail=f"Element {item.ElementType} is not implemented.")
    import json

    row = db.get(SavedFilter, body.Name)
    payload = json.dumps([item.model_dump() for item in body.CriteriaList])
    if row is None:
        row = SavedFilter(name=body.Name, description=body.Description, criteria=payload)
        db.add(row)
    else:
        row.description = body.Description
        row.criteria = payload
    db.commit()
    return _filter_out(row)


def _filter_out(row: SavedFilter) -> dict:
    import json

    return {"Name": row.name, "Description": row.description, "CriteriaList": json.loads(row.criteria or "[]")}


# --- Task (sample reset lives here) ---


@api.get("/Task/GetAllTasks", tags=["Task"])
def all_tasks(db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Task/GetAllTasks."""
    rows = db.query(DeskTask).order_by(DeskTask.id).all()
    return {"Tasks": [_task_out(row) for row in rows]}


@api.get("/Task/GetTaskByName", tags=["Task"])
def task_by_name(name: str, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors GET /api/Task/GetTaskByName."""
    row = db.query(DeskTask).filter(DeskTask.name == name).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return _task_out(row)


@api.put("/Task", tags=["Task"])
def put_task(body: TaskPut, db: Session = Depends(get_db), _user: DeskUser = Depends(require_user)) -> dict:
    """Mirrors PUT /api/Task.

    Status Run on SampleReset rebuilds the fictional database. EodBatch is named and does not run.
    """
    if body.Name == "SampleReset" and body.Status == "Run":
        _reset(db)
        return {"Name": "SampleReset", "Status": "Idle", "Detail": "Seed book restored."}
    row = db.query(DeskTask).filter(DeskTask.name == body.Name).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    if body.Name == "EodBatch":
        raise HTTPException(status_code=400, detail="EodBatch is named only. This demo does not run an end-of-day batch.")
    row.status = body.Status
    db.commit()
    return _task_out(row)


def _task_out(row: DeskTask) -> dict:
    return {"Id": row.id, "Name": row.name, "Status": row.status, "Description": row.description}


def _reset(db: Session) -> None:
    engine = get_engine()
    db.close()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    clear_curve_cache()
    fresh = session_local()
    try:
        seed(fresh)
    finally:
        fresh.close()
