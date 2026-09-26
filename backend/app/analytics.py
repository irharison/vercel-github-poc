"""Positions, P&L explain, sensitivities, VaR, stress, and the cash ladder.

VaR is a 1-day teaching implementation. Historical VaR applies the stored
factor moves to a linear sensitivity map. Parametric VaR uses the same map
with a variance-covariance matrix. Neither is a full revaluation historical
VaR. Stress scenarios do reprice the book.
"""

from __future__ import annotations

import contextvars
import math
from datetime import date

import numpy as np
from sqlalchemy.orm import Session, joinedload

from app.marketdata import (
    Market,
    bump_all_commodities,
    bump_all_curves,
    bump_all_equity_spots,
    bump_all_vols,
    bump_commodity,
    bump_curve,
    bump_equity_spot,
    bump_equity_vol,
    bump_fx,
    bump_fx_vol,
    load_factor_returns,
    load_market,
    previous_date,
    scale_fx_usd_strength,
    usd_per_unit,
    valuation_date,
)
from app.models import Book, Trade
from app.pricing import PriceResult, PricingError, TradeView, is_live, premium_cash_usd, price_trade, view_from_model

FACTORS = [
    "USD_RATE",
    "EUR_RATE",
    "GBP_RATE",
    "JPY_RATE",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "EQ_AETHER",
    "EQ_BRIGHTLINE",
    "EQ_CINDERCO",
    "BRENT",
    "TTF",
    "API2",
    "VOL_EQ",
    "VOL_FX",
]

Z_95 = 1.6448536269514722
Z_99 = 2.3263478740408408


_trade_ids: contextvars.ContextVar[set[int] | None] = contextvars.ContextVar("fathom_trade_ids", default=None)


def use_trade_ids(ids: set[int] | None):
    """Limit every report in this request to a filter result. None means the whole book."""
    return _trade_ids.set(ids)


def reset_trade_ids(token) -> None:
    _trade_ids.reset(token)


def _trades(db: Session, book: str | None) -> list[Trade]:
    query = db.query(Trade).options(joinedload(Trade.book), joinedload(Trade.counterparty))
    if book:
        query = query.join(Book).filter(Book.code == book)
    rows = query.order_by(Trade.id).all()
    ids = _trade_ids.get()
    if ids is not None:
        rows = [row for row in rows if row.id in ids]
    return rows


def _safe_price(view: TradeView, market: Market) -> PriceResult | None:
    if not is_live(view, market.as_of):
        return None
    try:
        return price_trade(view, market)
    except PricingError:
        return None


def price_book(db: Session, book: str | None = None, market: Market | None = None) -> list[dict]:
    as_of = valuation_date(db)
    market = market or load_market(db, as_of)
    rows = []
    for trade in _trades(db, book):
        view = view_from_model(trade)
        result = _safe_price(view, market)
        rows.append(
            {
                "trade_id": trade.id,
                "trade_ref": trade.trade_ref,
                "instrument_name": trade.instrument_name,
                "product_type": trade.product_type,
                "book": trade.book.code,
                "status": trade.status,
                "live": result is not None,
                "pv": None if result is None else result.pv,
                "pv_currency": None if result is None else result.pv_currency,
                "pv_usd": None if result is None else result.pv_usd,
                "model": None if result is None else result.model,
                "explanation": None if result is None else result.explanation,
                "measures": {} if result is None else result.measures,
                "inputs": {} if result is None else result.inputs,
                "cashflows": [] if result is None else result.cashflows,
            }
        )
    return rows


def _pv(view: TradeView, market: Market) -> float:
    result = _safe_price(view, market)
    return 0.0 if result is None else result.pv_usd


def sensitivities_for(view: TradeView, market: Market) -> dict:
    """USD sensitivities. DV01 is pv minus pv after a +1bp parallel bump, so a long bond is positive."""
    base = _pv(view, market)
    empty = {
        "pv_usd": base,
        "dv01": 0.0,
        "dv01_by_currency": {},
        "buckets": [],
        "delta": None,
        "vega": None,
        "factor": {},
    }
    if not is_live(view, market.as_of):
        return empty

    currencies = _rate_currencies(view, market)
    dv01_by_ccy: dict[str, float] = {}
    for ccy in currencies:
        bumped = bump_curve(market, ccy, 1.0)
        dv01_by_ccy[ccy] = base - _pv(view, bumped)
    dv01 = sum(dv01_by_ccy.values())

    buckets = []
    primary = _primary_curve(view, market)
    if primary and view.product_type in {"BOND", "IRS"}:
        for tenor, _kind, _rate in market.curves[primary]:
            bumped = bump_curve(market, primary, 1.0, tenor=tenor)
            buckets.append({"tenor": tenor, "currency": primary, "dv01": base - _pv(view, bumped)})

    delta = None
    vega = None
    factor: dict[str, float] = {}
    for ccy, amount in dv01_by_ccy.items():
        factor[f"{ccy}_RATE"] = -amount  # PnL per +1bp

    if view.product_type in {"FX_SPOT", "FX_FORWARD", "FX_OPTION"} and view.underlying in market.fx:
        pair = view.underlying
        spot = market.fx[pair]
        up = _pv(view, bump_fx(market, pair, 0.01))
        down = _pv(view, bump_fx(market, pair, -0.01))
        delta = (up - down) / (2 * spot * 0.01)  # USD per 1.0 spot
        factor[pair] = delta * spot  # USD per relative return
        if view.product_type == "FX_OPTION":
            up_v = _pv(view, bump_fx_vol(market, pair, 0.01))
            down_v = _pv(view, bump_fx_vol(market, pair, -0.01))
            vega = (up_v - down_v) / 2.0  # per vol point
            factor["VOL_FX"] = vega

    if view.product_type == "EQUITY_OPTION" and view.underlying in market.equities:
        ticker = view.underlying
        spot = market.equities[ticker][0]
        up = _pv(view, bump_equity_spot(market, ticker, 0.01))
        down = _pv(view, bump_equity_spot(market, ticker, -0.01))
        delta = (up - down) / (2 * spot * 0.01)
        factor[f"EQ_{ticker}"] = delta * spot
        up_v = _pv(view, bump_equity_vol(market, ticker, 0.01))
        down_v = _pv(view, bump_equity_vol(market, ticker, -0.01))
        vega = (up_v - down_v) / 2.0
        factor["VOL_EQ"] = factor.get("VOL_EQ", 0.0) + vega

    if view.product_type in {"COMMODITY_SWAP", "COMMODITY_FUTURE"} and view.underlying in market.commodities:
        name = view.underlying
        front = market.commodities[name][0][1]
        up = _pv(view, bump_commodity(market, name, absolute=1.0))
        delta = up - base  # USD per +1.0 price
        if front:
            factor[name] = delta * front  # per relative return

    return {
        "pv_usd": base,
        "dv01": dv01,
        "dv01_by_currency": dv01_by_ccy,
        "buckets": buckets,
        "delta": delta,
        "vega": vega,
        "factor": factor,
    }


def _rate_currencies(view: TradeView, market: Market) -> list[str]:
    found: list[str] = []
    if view.product_type in {"BOND", "IRS"}:
        found.append(view.notional_currency)
    elif view.product_type in {"FX_SPOT", "FX_FORWARD", "FX_OPTION"}:
        found.extend([view.notional_currency, view.secondary_currency or ""])
    elif view.product_type == "EQUITY_OPTION" and view.underlying in market.equities:
        found.append(market.equities[view.underlying][3])
    elif view.product_type in {"COMMODITY_SWAP", "COMMODITY_FUTURE"} and view.underlying in market.commodity_meta:
        found.append(market.commodity_meta[view.underlying][0])
    return [ccy for ccy in found if ccy in market.curves]


def _primary_curve(view: TradeView, market: Market) -> str | None:
    currencies = _rate_currencies(view, market)
    return currencies[0] if currencies else None


def risk_table(db: Session, book: str | None = None) -> dict:
    market = load_market(db, valuation_date(db))
    rows = []
    totals = {"pv_usd": 0.0, "dv01": 0.0, "delta": 0.0, "vega": 0.0}
    bucket_totals: dict[str, float] = {}
    for trade in _trades(db, book):
        view = view_from_model(trade)
        sens = sensitivities_for(view, market)
        if not is_live(view, market.as_of):
            continue
        rows.append(
            {
                "trade_id": trade.id,
                "trade_ref": trade.trade_ref,
                "instrument_name": trade.instrument_name,
                "product_type": trade.product_type,
                "book": trade.book.code,
                "currency": trade.notional_currency,
                **sens,
            }
        )
        totals["pv_usd"] += sens["pv_usd"]
        totals["dv01"] += sens["dv01"]
        if sens["delta"] is not None and trade.product_type in {"EQUITY_OPTION", "FX_OPTION"}:
            totals["delta"] += sens["delta"]
        if sens["vega"] is not None:
            totals["vega"] += sens["vega"]
        for bucket in sens["buckets"]:
            key = f"{bucket['currency']} {bucket['tenor']}"
            bucket_totals[key] = bucket_totals.get(key, 0.0) + bucket["dv01"]
    return {
        "valuation_date": market.as_of.isoformat(),
        "rows": rows,
        "totals": totals,
        "buckets": [{"label": key, "dv01": value} for key, value in bucket_totals.items()],
        "notes": {
            "dv01": "Parallel DV01 in USD: present value minus present value after a +1 basis point bump of the curves that price the trade. Positive means the book loses money if yields rise (long bonds, receive-fixed swaps).",
            "buckets": "Each pillar is bumped on its own. The pieces do not add exactly to parallel DV01.",
            "delta": "Change in USD value for a 1.0 move in the underlying price (spot or forward).",
            "vega": "Change in USD value for a +1 volatility point (0.01 absolute vol).",
        },
    }


def _portfolio_factors(db: Session, book: str | None, market: Market) -> tuple[list[dict], dict[str, float]]:
    rows = []
    total = {name: 0.0 for name in FACTORS}
    for trade in _trades(db, book):
        view = view_from_model(trade)
        if not is_live(view, market.as_of):
            continue
        sens = sensitivities_for(view, market)
        for name, value in sens["factor"].items():
            if name in total:
                total[name] += value
        rows.append({"trade_ref": trade.trade_ref, "book": trade.book.code, "factor": sens["factor"], "pv_usd": sens["pv_usd"]})
    return rows, total


def var_report(db: Session, book: str | None = None) -> dict:
    market = load_market(db, valuation_date(db))
    _rows, exposure = _portfolio_factors(db, book, market)
    dates, factors, matrix = load_factor_returns(db)
    index = {name: i for i, name in enumerate(factors)}
    used = [name for name in FACTORS if name in index]
    s = np.array([exposure.get(name, 0.0) for name in used], dtype=float)
    hist = np.array([[row[index[name]] for name in used] for row in matrix], dtype=float)
    if len(hist) == 0 or s.size == 0:
        raise RuntimeError("Factor history is empty.")
    pnl = hist @ s
    losses = -pnl
    hist_95 = float(np.quantile(losses, 0.95))
    hist_99 = float(np.quantile(losses, 0.99))
    tail = losses[losses >= np.quantile(losses, 0.95)]
    es_95 = float(tail.mean()) if len(tail) else hist_95
    cov = np.cov(hist, rowvar=False, ddof=1)
    if cov.ndim == 0:
        cov = np.array([[float(cov)]])
    variance = float(s @ cov @ s)
    sigma = math.sqrt(max(variance, 0.0))
    marginal = cov @ s
    component = []
    for i, name in enumerate(used):
        contrib_var = float(s[i] * marginal[i])
        share = contrib_var / variance if variance else 0.0
        component.append(
            {
                "factor": name,
                "exposure": float(s[i]),
                "standalone_vol": float(math.sqrt(cov[i, i]) * abs(s[i])),
                "component_var_95": share * Z_95 * sigma,
                "share": share,
            }
        )
    component.sort(key=lambda item: abs(item["component_var_95"]), reverse=True)
    return {
        "valuation_date": market.as_of.isoformat(),
        "holding_period": "1 day",
        "observations": len(dates),
        "window_start": dates[0].isoformat(),
        "window_end": dates[-1].isoformat(),
        "parametric": {"var_95": Z_95 * sigma, "var_99": Z_99 * sigma, "sigma": sigma},
        "historical": {"var_95": hist_95, "var_99": hist_99, "expected_shortfall_95": es_95},
        "factors": component,
        "method": (
            "Both numbers use a linear map from factor moves to P&L (DV01, delta, vega). "
            "Historical VaR is the 95th and 99th percentile of loss across the stored daily scenarios. "
            "Parametric VaR assumes those scenarios are multivariate normal and scales the standard deviation "
            "by 1.64 or 2.33. This is not a full revaluation and it is not a regulatory model. "
            "The scenarios are synthetic, generated for the demo, not a market history."
        ),
    }


STRESS_LIBRARY = [
    {"id": "rates_up", "name": "Rates +100bp", "rate_bp": 100, "usd_strength_pct": 0, "equity_pct": 0, "vol_points": 0, "commodity_pct": 0},
    {"id": "rates_down", "name": "Rates −50bp", "rate_bp": -50, "usd_strength_pct": 0, "equity_pct": 0, "vol_points": 0, "commodity_pct": 0},
    {"id": "usd_up", "name": "Dollar +5%", "rate_bp": 0, "usd_strength_pct": 5, "equity_pct": 0, "vol_points": 0, "commodity_pct": 0},
    {"id": "equities_down", "name": "Equities −20%, vol +5pts", "rate_bp": 0, "usd_strength_pct": 0, "equity_pct": -20, "vol_points": 5, "commodity_pct": 0},
    {"id": "energy_down", "name": "Energy −15%", "rate_bp": 0, "usd_strength_pct": 0, "equity_pct": 0, "vol_points": 0, "commodity_pct": -15},
    {
        "id": "risk_off",
        "name": "Risk-off",
        "rate_bp": -25,
        "usd_strength_pct": 3,
        "equity_pct": -15,
        "vol_points": 8,
        "commodity_pct": -10,
    },
]


def _apply_shock(market: Market, shock: dict) -> Market:
    shocked = market
    if shock.get("rate_bp"):
        shocked = bump_all_curves(shocked, float(shock["rate_bp"]))
    if shock.get("usd_strength_pct"):
        shocked = scale_fx_usd_strength(shocked, float(shock["usd_strength_pct"]))
    if shock.get("equity_pct"):
        shocked = bump_all_equity_spots(shocked, float(shock["equity_pct"]) / 100.0)
    if shock.get("vol_points"):
        shocked = bump_all_vols(shocked, float(shock["vol_points"]))
    if shock.get("commodity_pct"):
        shocked = bump_all_commodities(shocked, float(shock["commodity_pct"]) / 100.0)
    return shocked


def stress_report(db: Session, book: str | None = None, extra: dict | None = None) -> dict:
    market = load_market(db, valuation_date(db))
    trades = []
    for trade in _trades(db, book):
        view = view_from_model(trade)
        if is_live(view, market.as_of):
            trades.append((trade, view, _pv(view, market)))
    base = sum(item[2] for item in trades)
    scenarios = list(STRESS_LIBRARY)
    if extra:
        scenarios = [extra]
    results = []
    for shock in scenarios:
        shocked = _apply_shock(market, shock)
        by_book: dict[str, float] = {}
        total = 0.0
        details = []
        for trade, view, base_pv in trades:
            new_pv = _pv(view, shocked)
            pnl = new_pv - base_pv
            total += pnl
            by_book[trade.book.code] = by_book.get(trade.book.code, 0.0) + pnl
            details.append({"trade_ref": trade.trade_ref, "instrument_name": trade.instrument_name, "pnl_usd": pnl})
        details.sort(key=lambda row: row["pnl_usd"])
        results.append(
            {
                "id": shock.get("id", "custom"),
                "name": shock.get("name", "Custom"),
                "shock": {k: shock[k] for k in ("rate_bp", "usd_strength_pct", "equity_pct", "vol_points", "commodity_pct")},
                "pnl_usd": total,
                "base_pv_usd": base,
                "by_book": [{"book": code, "pnl_usd": value} for code, value in sorted(by_book.items())],
                "worst": details[:5],
                "best": list(reversed(details[-5:])),
            }
        )
    return {"valuation_date": market.as_of.isoformat(), "scenarios": results}


def _with_pieces(base: Market, today: Market) -> list[tuple[str, Market]]:
    """Waterfall markets. Each step replaces one slice of yesterday's market with today's."""
    roll = base.copy()
    roll.as_of = today.as_of
    rates = roll.copy()
    rates.curves = today.curves
    fx = rates.copy()
    fx.fx = today.fx
    spot = fx.copy()
    spot.equities = {
        ticker: (today.equities[ticker][0], roll.equities[ticker][1], roll.equities[ticker][2], roll.equities[ticker][3], roll.equities[ticker][4])
        if ticker in today.equities and ticker in roll.equities
        else today.equities.get(ticker, roll.equities.get(ticker))
        for ticker in set(today.equities) | set(roll.equities)
    }
    spot.commodities = today.commodities
    vol = today.copy()
    return [("time", roll), ("rates", rates), ("fx", fx), ("spot", spot), ("vol", vol)]


def pnl_report(db: Session, book: str | None = None) -> dict:
    today = load_market(db, valuation_date(db))
    yesterday = load_market(db, previous_date(db))
    steps = _with_pieces(yesterday, today)
    rows = []
    totals = {key: 0.0 for key in ("new_trades", "time", "rates", "fx", "spot", "vol", "residual", "total")}
    for trade in _trades(db, book):
        view = view_from_model(trade)
        if view.status == "CANCELLED" or view.maturity_date < yesterday.as_of:
            continue
        if not is_live(view, today.as_of) and view.maturity_date < today.as_of:
            continue
        pv_today = _pv(view, today) if is_live(view, today.as_of) else 0.0
        if view.trade_date > yesterday.as_of:
            premium = premium_cash_usd(view, today)
            total = pv_today - premium
            row = {
                "trade_id": trade.id,
                "trade_ref": trade.trade_ref,
                "instrument_name": trade.instrument_name,
                "book": trade.book.code,
                "product_type": trade.product_type,
                "new_trades": total,
                "time": 0.0,
                "rates": 0.0,
                "fx": 0.0,
                "spot": 0.0,
                "vol": 0.0,
                "residual": 0.0,
                "total": total,
                "pv_today": pv_today,
                "pv_yesterday": None,
            }
        else:
            pv_y = _pv(view, yesterday)
            running = pv_y
            parts = {}
            for name, market in steps:
                nxt = _pv(view, market) if is_live(view, today.as_of) or name == "time" else pv_today
                # A trade that matured today contributes the roll down to zero in time.
                if view.maturity_date < today.as_of:
                    nxt = 0.0
                parts[name] = nxt - running
                running = nxt
            explained = sum(parts.values())
            total = pv_today - pv_y
            residual = total - explained
            row = {
                "trade_id": trade.id,
                "trade_ref": trade.trade_ref,
                "instrument_name": trade.instrument_name,
                "book": trade.book.code,
                "product_type": trade.product_type,
                "new_trades": 0.0,
                "time": parts.get("time", 0.0),
                "rates": parts.get("rates", 0.0),
                "fx": parts.get("fx", 0.0),
                "spot": parts.get("spot", 0.0),
                "vol": parts.get("vol", 0.0),
                "residual": residual,
                "total": total,
                "pv_today": pv_today,
                "pv_yesterday": pv_y,
            }
        for key in totals:
            totals[key] += row[key]
        rows.append(row)
    return {
        "valuation_date": today.as_of.isoformat(),
        "previous_date": yesterday.as_of.isoformat(),
        "base_currency": "USD",
        "rows": rows,
        "totals": totals,
        "order": ["new_trades", "time", "rates", "fx", "spot", "vol", "residual"],
        "notes": (
            "Existing trades start from yesterday's close. Time rolls the valuation date forward "
            "with yesterday's quotes still in place. Rates, FX, prices (equities and commodity forwards), and volatility are "
            "then replaced one slice at a time with today's market. Residual is whatever the full "
            "move does not attribute, mostly cross effects. Trades booked today are 'new trades': "
            "model value minus premium paid. Levels are fictional."
        ),
    }


def positions_report(db: Session, book: str | None = None) -> dict:
    market = load_market(db, valuation_date(db))
    groups: dict[tuple, dict] = {}
    currency_amounts: dict[str, float] = {}
    for trade in _trades(db, book):
        view = view_from_model(trade)
        if not is_live(view, market.as_of):
            continue
        result = _safe_price(view, market)
        pv = 0.0 if result is None else result.pv_usd
        key_name = view.underlying or view.instrument_name
        key = (trade.book.code, view.product_type, key_name, view.notional_currency)
        slot = groups.setdefault(
            key,
            {
                "book": trade.book.code,
                "book_name": trade.book.name,
                "product_type": view.product_type,
                "instrument": key_name,
                "currency": view.notional_currency,
                "trades": 0,
                "signed_notional": 0.0,
                "pv_usd": 0.0,
            },
        )
        sign = 1.0 if view.direction in {"BUY", "RECEIVE"} else -1.0
        slot["trades"] += 1
        slot["signed_notional"] += sign * abs(view.notional)
        slot["pv_usd"] += pv
        if view.product_type in {"FX_SPOT", "FX_FORWARD"} and result is not None:
            for cf in result.cashflows:
                currency_amounts[cf["currency"]] = currency_amounts.get(cf["currency"], 0.0) + cf["amount"]
    rows = sorted(groups.values(), key=lambda row: (row["book"], row["product_type"], row["instrument"]))
    ccy_rows = []
    for ccy, amount in sorted(currency_amounts.items()):
        ccy_rows.append(
            {
                "currency": ccy,
                "amount": amount,
                "usd": amount * usd_per_unit(market, ccy),
            }
        )
    return {
        "valuation_date": market.as_of.isoformat(),
        "rows": rows,
        "currency_position": ccy_rows,
        "pv_usd": sum(row["pv_usd"] for row in rows),
    }


def cashflow_ladder(db: Session, book: str | None = None) -> dict:
    priced = price_book(db, book)
    flows = []
    by_date: dict[str, dict[str, float]] = {}
    for row in priced:
        for cf in row["cashflows"]:
            item = {
                "date": cf["date"],
                "currency": cf["currency"],
                "amount": cf["amount"],
                "kind": cf["kind"],
                "estimated": cf["estimated"],
                "trade_ref": row["trade_ref"],
                "instrument_name": row["instrument_name"],
                "book": row["book"],
            }
            flows.append(item)
            bucket = by_date.setdefault(cf["date"], {})
            bucket[cf["currency"]] = bucket.get(cf["currency"], 0.0) + cf["amount"]
    currencies = sorted({cf["currency"] for cf in flows})
    ladder = []
    for when in sorted(by_date):
        ladder.append({"date": when, "amounts": {ccy: by_date[when].get(ccy, 0.0) for ccy in currencies}})
    return {
        "valuation_date": valuation_date(db).isoformat(),
        "currencies": currencies,
        "ladder": ladder,
        "flows": flows,
    }


def summary(db: Session, book: str | None = None) -> dict:
    as_of = valuation_date(db)
    market = load_market(db, as_of)
    counts: dict[str, int] = {}
    attention = []
    pv = 0.0
    dv01 = 0.0
    for trade in _trades(db, book):
        counts[trade.status] = counts.get(trade.status, 0) + 1
        if trade.status in {"BOOKED", "VERIFIED"}:
            attention.append(
                {
                    "trade_id": trade.id,
                    "trade_ref": trade.trade_ref,
                    "instrument_name": trade.instrument_name,
                    "status": trade.status,
                    "book": trade.book.code,
                    "product_type": trade.product_type,
                }
            )
        view = view_from_model(trade)
        if is_live(view, as_of):
            sens = sensitivities_for(view, market)
            pv += sens["pv_usd"]
            dv01 += sens["dv01"]
    pnl = pnl_report(db, book)
    var = var_report(db, book)
    return {
        "valuation_date": as_of.isoformat(),
        "previous_date": previous_date(db).isoformat(),
        "base_currency": "USD",
        "counts": counts,
        "pv_usd": pv,
        "day_pnl": pnl["totals"]["total"],
        "dv01": dv01,
        "var_95": var["historical"]["var_95"],
        "var_99": var["parametric"]["var_99"],
        "attention": attention,
        "pnl_totals": pnl["totals"],
    }
