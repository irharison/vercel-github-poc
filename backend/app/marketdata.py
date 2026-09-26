"""Market snapshots and yield-curve construction.

One curve per currency is bootstrapped from deposit pillars and par swap pillars.
That is a single-curve teaching model: the same curve discounts and projects.
A real multi-curve desk discounts on OIS and projects the floating index on a
separate forwarding curve. Public Orchestrade material describes multi-curve
support; this demo does not implement it.
"""

from __future__ import annotations

import threading
from dataclasses import dataclass
from datetime import date, timedelta

import QuantLib as ql
from sqlalchemy.orm import Session

from app.models import (
    AppSetting,
    CommodityForward,
    CurvePillar,
    EquityQuote,
    FactorReturn,
    FxSpot,
    FxVol,
)

ql_lock = threading.RLock()

PAIR_CURRENCIES = {
    "EURUSD": ("EUR", "USD"),
    "GBPUSD": ("GBP", "USD"),
    "USDJPY": ("USD", "JPY"),
}

_CURVE_CACHE: dict[tuple, object] = {}


def clear_curve_cache() -> None:
    with ql_lock:
        _CURVE_CACHE.clear()


def to_ql(d: date) -> ql.Date:
    return ql.Date(d.day, d.month, d.year)


def from_ql(d: ql.Date) -> date:
    return date(d.year(), d.month(), d.dayOfMonth())


def calendar_for(ccy: str) -> ql.Calendar:
    return {
        "USD": ql.UnitedStates(ql.UnitedStates.GovernmentBond),
        "EUR": ql.TARGET(),
        "GBP": ql.UnitedKingdom(),
        "JPY": ql.Japan(),
    }[ccy]


def ql_currency(ccy: str) -> ql.Currency:
    return {
        "USD": ql.USDCurrency(),
        "EUR": ql.EURCurrency(),
        "GBP": ql.GBPCurrency(),
        "JPY": ql.JPYCurrency(),
    }[ccy]


@dataclass
class Market:
    as_of: date
    curves: dict[str, tuple[tuple[str, str, float], ...]]
    fx: dict[str, float]
    equities: dict[str, tuple[float, float, float, str, str]]
    fx_vols: dict[str, float]
    commodities: dict[str, tuple[tuple[str, float], ...]]
    commodity_meta: dict[str, tuple[str, str, str]]

    def copy(self) -> "Market":
        return Market(
            as_of=self.as_of,
            curves={k: v for k, v in self.curves.items()},
            fx=dict(self.fx),
            equities=dict(self.equities),
            fx_vols=dict(self.fx_vols),
            commodities={k: v for k, v in self.commodities.items()},
            commodity_meta=dict(self.commodity_meta),
        )


class BuiltCurve:
    """A bootstrapped discount curve and the index that projects on it."""

    def __init__(self, as_of: date, ccy: str, pillars: tuple[tuple[str, str, float], ...]):
        self.as_of = as_of
        self.ccy = ccy
        self.ql_date = to_ql(as_of)
        self._keepers: list[object] = []
        ql.Settings.instance().evaluationDate = self.ql_date
        cal = calendar_for(ccy)
        dc_dep = ql.Actual360()
        dc_fix = ql.Thirty360(ql.Thirty360.USA)
        handle = ql.RelinkableYieldTermStructureHandle()
        # Unique name so fixings from one build do not leak into another.
        index = ql.IborIndex(
            f"{ccy}-IBOR-6M-{id(self)}",
            ql.Period("6M"),
            2,
            ql_currency(ccy),
            cal,
            ql.ModifiedFollowing,
            False,
            dc_dep,
            handle,
        )
        helpers: list[ql.RateHelper] = []
        deposit_6m = 0.01
        for tenor, pillar_type, rate in pillars:
            quote = ql.QuoteHandle(ql.SimpleQuote(float(rate)))
            self._keepers.append(quote)
            if pillar_type == "deposit":
                helpers.append(
                    ql.DepositRateHelper(
                        quote,
                        ql.Period(tenor),
                        2,
                        cal,
                        ql.ModifiedFollowing,
                        False,
                        dc_dep,
                    )
                )
                if tenor == "6M":
                    deposit_6m = float(rate)
            else:
                freq = ql.Annual if ccy == "EUR" else ql.Semiannual
                helpers.append(
                    ql.SwapRateHelper(
                        quote,
                        ql.Period(tenor),
                        cal,
                        freq,
                        ql.Unadjusted,
                        dc_fix,
                        index,
                    )
                )
        if not helpers:
            raise ValueError(f"No pillars for {ccy}")
        curve = ql.PiecewiseLogCubicDiscount(self.ql_date, helpers, ql.Actual365Fixed())
        curve.enableExtrapolation()
        handle.linkTo(curve)
        self._seed_fixings(index, cal, deposit_6m)
        self.curve = curve
        self.handle = ql.YieldTermStructureHandle(curve)
        self.index = index
        self.calendar = cal
        self._keepers.extend(helpers)
        self._keepers.append(handle)

    def _seed_fixings(self, index: ql.IborIndex, cal: ql.Calendar, rate: float) -> None:
        """Past floating periods need a published fixing. We fill business days with the 6M deposit."""
        start = cal.advance(self.ql_date, -2, ql.Years)
        dates: list[ql.Date] = []
        rates: list[float] = []
        d = start
        while d <= self.ql_date:
            if index.isValidFixingDate(d):
                dates.append(d)
                rates.append(rate)
            d = cal.advance(d, 1, ql.Days)
        if dates:
            index.addFixings(dates, rates, True)

    def discount(self, d: date) -> float:
        ql.Settings.instance().evaluationDate = self.ql_date
        if d <= self.as_of:
            return 1.0
        return float(self.curve.discount(to_ql(d)))

    def zero_continuous(self, d: date) -> float:
        ql.Settings.instance().evaluationDate = self.ql_date
        if d <= self.as_of:
            d = self.as_of + timedelta(days=1)
        t = ql.Actual365Fixed().yearFraction(self.ql_date, to_ql(d))
        if t <= 1e-8:
            return 0.0
        df = float(self.curve.discount(to_ql(d)))
        if df <= 0:
            return 0.0
        return -1.0 * __import__("math").log(df) / t


def get_curve(market: Market, ccy: str) -> BuiltCurve:
    pillars = market.curves.get(ccy)
    if not pillars:
        raise ValueError(f"No yield curve loaded for {ccy} on {market.as_of.isoformat()}")
    key = (market.as_of.toordinal(), ccy, pillars)
    with ql_lock:
        cached = _CURVE_CACHE.get(key)
        if cached is None:
            if len(_CURVE_CACHE) > 96:
                _CURVE_CACHE.clear()
            cached = BuiltCurve(market.as_of, ccy, pillars)
            _CURVE_CACHE[key] = cached
        return cached  # type: ignore[return-value]


def usd_per_unit(market: Market, ccy: str) -> float:
    """How many USD for one unit of ccy, using the stored spots."""
    if ccy == "USD":
        return 1.0
    if ccy == "EUR":
        return market.fx["EURUSD"]
    if ccy == "GBP":
        return market.fx["GBPUSD"]
    if ccy == "JPY":
        return 1.0 / market.fx["USDJPY"]
    raise ValueError(f"Cannot convert {ccy} to USD")


def to_usd(market: Market, amount: float, ccy: str) -> float:
    return amount * usd_per_unit(market, ccy)


def tenor_date(as_of: date, tenor: str, ccy: str = "USD") -> date:
    cal = calendar_for(ccy)
    return from_ql(cal.advance(to_ql(as_of), ql.Period(tenor), ql.ModifiedFollowing))


def forward_price(market: Market, underlying: str, when: date) -> float:
    pillars = market.commodities.get(underlying)
    if not pillars:
        raise ValueError(f"No forward curve for {underlying}")
    ccy = market.commodity_meta[underlying][0]
    points = [(tenor_date(market.as_of, tenor, ccy), price) for tenor, price in pillars]
    points.sort()
    if when <= points[0][0]:
        return points[0][1]
    if when >= points[-1][0]:
        return points[-1][1]
    for (d0, p0), (d1, p1) in zip(points, points[1:]):
        if d0 <= when <= d1:
            span = (d1 - d0).days
            w = 0 if span == 0 else (when - d0).days / span
            # Linear in price. Levels are close, and the screen shows the pillars directly.
            return p0 + (p1 - p0) * w
    return points[-1][1]


def fair_fx_forward(market: Market, pair: str, maturity: date) -> float:
    """Covered-interest forward in market convention (EURUSD, GBPUSD, USDJPY)."""
    spot = market.fx[pair]
    base, quote = PAIR_CURRENCIES[pair]
    df_base = get_curve(market, base).discount(maturity)
    df_quote = get_curve(market, quote).discount(maturity)
    if df_quote == 0:
        return spot
    return spot * df_base / df_quote


def bump_all_curves(market: Market, bp: float) -> Market:
    shift = bp / 10_000.0
    m = market.copy()
    m.curves = {
        ccy: tuple((tenor, kind, rate + shift) for tenor, kind, rate in pillars)
        for ccy, pillars in market.curves.items()
    }
    return m


def bump_curve(market: Market, ccy: str, bp: float, tenor: str | None = None) -> Market:
    shift = bp / 10_000.0
    m = market.copy()
    curves = dict(market.curves)
    curves[ccy] = tuple(
        (t, kind, rate + shift if tenor is None or t == tenor else rate)
        for t, kind, rate in market.curves[ccy]
    )
    m.curves = curves
    return m


def bump_fx(market: Market, pair: str, relative: float) -> Market:
    m = market.copy()
    fx = dict(market.fx)
    fx[pair] = market.fx[pair] * (1.0 + relative)
    m.fx = fx
    return m


def scale_fx_usd_strength(market: Market, pct: float) -> Market:
    """pct = 5 means the dollar is 5% stronger: EURUSD and GBPUSD fall, USDJPY rises."""
    m = market.copy()
    fx = dict(market.fx)
    factor = pct / 100.0
    for pair in fx:
        base, quote = PAIR_CURRENCIES[pair]
        if quote == "USD":
            fx[pair] = market.fx[pair] * (1.0 - factor)
        elif base == "USD":
            fx[pair] = market.fx[pair] * (1.0 + factor)
    m.fx = fx
    return m


def bump_equity_spot(market: Market, ticker: str, relative: float) -> Market:
    m = market.copy()
    equities = dict(market.equities)
    spot, vol, div, ccy, name = market.equities[ticker]
    equities[ticker] = (spot * (1.0 + relative), vol, div, ccy, name)
    m.equities = equities
    return m


def bump_equity_vol(market: Market, ticker: str, absolute: float) -> Market:
    m = market.copy()
    equities = dict(market.equities)
    spot, vol, div, ccy, name = market.equities[ticker]
    equities[ticker] = (spot, max(vol + absolute, 1e-4), div, ccy, name)
    m.equities = equities
    return m


def bump_all_equity_spots(market: Market, relative: float) -> Market:
    m = market.copy()
    m.equities = {
        ticker: (spot * (1.0 + relative), vol, div, ccy, name)
        for ticker, (spot, vol, div, ccy, name) in market.equities.items()
    }
    return m


def bump_all_vols(market: Market, vol_points: float) -> Market:
    """vol_points is in percentage points: 1.0 adds 0.01 to every stored volatility."""
    absolute = vol_points / 100.0
    m = market.copy()
    m.equities = {
        ticker: (spot, max(vol + absolute, 1e-4), div, ccy, name)
        for ticker, (spot, vol, div, ccy, name) in market.equities.items()
    }
    m.fx_vols = {pair: max(vol + absolute, 1e-4) for pair, vol in market.fx_vols.items()}
    return m


def bump_fx_vol(market: Market, pair: str, absolute: float) -> Market:
    m = market.copy()
    vols = dict(market.fx_vols)
    vols[pair] = max(market.fx_vols[pair] + absolute, 1e-4)
    m.fx_vols = vols
    return m


def bump_commodity(market: Market, underlying: str, absolute: float = 0.0, relative: float = 0.0) -> Market:
    m = market.copy()
    commodities = dict(market.commodities)
    commodities[underlying] = tuple(
        (tenor, price + absolute if absolute else price * (1.0 + relative))
        for tenor, price in market.commodities[underlying]
    )
    m.commodities = commodities
    return m


def bump_all_commodities(market: Market, relative: float) -> Market:
    m = market.copy()
    m.commodities = {
        name: tuple((tenor, price * (1.0 + relative)) for tenor, price in pillars)
        for name, pillars in market.commodities.items()
    }
    return m


def load_market(db: Session, as_of: date) -> Market:
    pillars: dict[str, list[tuple[str, str, float]]] = {}
    rows = (
        db.query(CurvePillar)
        .filter(CurvePillar.as_of == as_of)
        .all()
    )
    order = {"1M": 1, "3M": 2, "6M": 3, "1Y": 4, "2Y": 5, "3Y": 6, "5Y": 7, "7Y": 8, "10Y": 9, "20Y": 10, "30Y": 11}
    for row in rows:
        pillars.setdefault(row.currency, []).append((row.tenor, row.pillar_type, row.rate))
    curves = {
        ccy: tuple(sorted(items, key=lambda item: order.get(item[0], 99)))
        for ccy, items in pillars.items()
    }
    fx = {row.pair: row.spot for row in db.query(FxSpot).filter(FxSpot.as_of == as_of)}
    equities = {
        row.ticker: (row.spot, row.vol, row.dividend_yield, row.currency, row.name)
        for row in db.query(EquityQuote).filter(EquityQuote.as_of == as_of)
    }
    fx_vols = {row.pair: row.vol for row in db.query(FxVol).filter(FxVol.as_of == as_of)}
    commodities: dict[str, list[tuple[str, float]]] = {}
    meta: dict[str, tuple[str, str, str]] = {}
    for row in db.query(CommodityForward).filter(CommodityForward.as_of == as_of):
        commodities.setdefault(row.underlying, []).append((row.tenor, row.price))
        meta[row.underlying] = (row.currency, row.unit, row.name)
    return Market(
        as_of=as_of,
        curves=curves,
        fx=fx,
        equities=equities,
        fx_vols=fx_vols,
        commodities={k: tuple(v) for k, v in commodities.items()},
        commodity_meta=meta,
    )


def setting(db: Session, key: str) -> str:
    row = db.get(AppSetting, key)
    if row is None:
        raise RuntimeError(f"Missing setting {key}")
    return row.value


def valuation_date(db: Session) -> date:
    return date.fromisoformat(setting(db, "valuation_date"))


def previous_date(db: Session) -> date:
    return date.fromisoformat(setting(db, "previous_date"))


def load_factor_returns(db: Session) -> tuple[list[date], list[str], list[list[float]]]:
    rows = db.query(FactorReturn).order_by(FactorReturn.scenario_date, FactorReturn.factor).all()
    dates: list[date] = []
    factors: list[str] = []
    by_date: dict[date, dict[str, float]] = {}
    for row in rows:
        by_date.setdefault(row.scenario_date, {})[row.factor] = row.value
        if row.factor not in factors:
            factors.append(row.factor)
    factors = sorted(set(factors))
    matrix: list[list[float]] = []
    for d in sorted(by_date):
        dates.append(d)
        matrix.append([by_date[d].get(f, 0.0) for f in factors])
    return dates, factors, matrix


def holiday_name_from_calendar(code: str, d: date) -> str | None:
    cal = {
        "NYC": calendar_for("USD"),
        "TARGET": calendar_for("EUR"),
        "LON": calendar_for("GBP"),
        "TKY": calendar_for("JPY"),
    }[code]
    qd = to_ql(d)
    if cal.isBusinessDay(qd):
        return None
    if qd.weekday() in (ql.Saturday, ql.Sunday):
        return None
    return "Holiday"
