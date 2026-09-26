"""Valuation. Bonds, swaps, FX forwards, and options go through QuantLib.

Commodity swaps are discounted expected settlement amounts on the same yield
curve, using the stored forward pillars. Listed futures are undiscounted
mark-to-market, which matches daily variation margin better than a discounted
forward.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta

import QuantLib as ql

from app.marketdata import (
    PAIR_CURRENCIES,
    Market,
    fair_fx_forward,
    forward_price,
    get_curve,
    ql_lock,
    tenor_date,
    to_ql,
    to_usd,
)

FREQ = {
    "1M": ql.Monthly,
    "3M": ql.Quarterly,
    "6M": ql.Semiannual,
    "1Y": ql.Annual,
}


@dataclass
class TradeView:
    product_type: str
    direction: str
    notional: float
    notional_currency: str
    secondary_currency: str | None = None
    fixed_rate: float | None = None
    strike: float | None = None
    premium: float | None = None
    quantity: float | None = None
    multiplier: float | None = None
    underlying: str | None = None
    option_type: str | None = None
    instrument_name: str = ""
    trade_date: date = date(2026, 9, 25)
    start_date: date = date(2026, 9, 25)
    maturity_date: date = date(2027, 9, 25)
    pay_frequency: str = "6M"
    status: str = "BOOKED"


@dataclass
class PriceResult:
    pv: float
    pv_currency: str
    pv_usd: float
    model: str
    explanation: str
    measures: dict
    cashflows: list[dict] = field(default_factory=list)
    inputs: dict = field(default_factory=dict)


class PricingError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def direction_sign(direction: str) -> float:
    if direction in {"BUY", "RECEIVE"}:
        return 1.0
    if direction in {"SELL", "PAY"}:
        return -1.0
    raise PricingError(f"Unknown direction {direction}")


def _year_fraction(start: date, end: date) -> float:
    if end <= start:
        return 0.0
    return ql.Actual365Fixed().yearFraction(to_ql(start), to_ql(end))


def black_scholes_price(
    spot: float,
    strike: float,
    vol: float,
    rate: float,
    div: float,
    expiry: date,
    valuation: date,
    call: bool,
) -> tuple[float, float, float]:
    """European option price, delta, and vega per 1.0 absolute vol, from QuantLib."""
    if expiry <= valuation:
        intrinsic = max(spot - strike, 0.0) if call else max(strike - spot, 0.0)
        return intrinsic, (1.0 if call and spot > strike else (-1.0 if not call and spot < strike else 0.0)), 0.0
    with ql_lock:
        ql.Settings.instance().evaluationDate = to_ql(valuation)
        spot_h = ql.QuoteHandle(ql.SimpleQuote(spot))
        rf = ql.YieldTermStructureHandle(ql.FlatForward(to_ql(valuation), rate, ql.Actual365Fixed()))
        dividend = ql.YieldTermStructureHandle(ql.FlatForward(to_ql(valuation), div, ql.Actual365Fixed()))
        vol_h = ql.BlackVolTermStructureHandle(
            ql.BlackConstantVol(to_ql(valuation), ql.NullCalendar(), max(vol, 1e-6), ql.Actual365Fixed())
        )
        process = ql.BlackScholesMertonProcess(spot_h, dividend, rf, vol_h)
        payoff = ql.PlainVanillaPayoff(ql.Option.Call if call else ql.Option.Put, strike)
        option = ql.EuropeanOption(payoff, ql.EuropeanExercise(to_ql(expiry)))
        option.setPricingEngine(ql.AnalyticEuropeanEngine(process))
        return float(option.NPV()), float(option.delta()), float(option.vega())


def _cf(when: date, amount: float, currency: str, kind: str, estimated: bool) -> dict:
    return {
        "date": when.isoformat(),
        "amount": amount,
        "currency": currency,
        "kind": kind,
        "estimated": estimated,
    }


def _schedule(start: date, maturity: date, frequency: str, ccy: str, backwards: bool = False) -> ql.Schedule:
    from app.marketdata import calendar_for

    cal = calendar_for(ccy)
    return ql.Schedule(
        to_ql(start),
        to_ql(maturity),
        ql.Period(FREQ[frequency]),
        cal,
        ql.Unadjusted if backwards else ql.ModifiedFollowing,
        ql.Unadjusted,
        ql.DateGeneration.Backward if backwards else ql.DateGeneration.Forward,
        False,
    )


def price_trade(trade: TradeView, market: Market) -> PriceResult:
    try:
        with ql_lock:
            ql.Settings.instance().evaluationDate = to_ql(market.as_of)
            if trade.product_type == "BOND":
                result = _price_bond(trade, market)
            elif trade.product_type == "IRS":
                result = _price_irs(trade, market)
            elif trade.product_type in {"FX_SPOT", "FX_FORWARD"}:
                result = _price_fx(trade, market)
            elif trade.product_type == "EQUITY_OPTION":
                result = _price_equity_option(trade, market)
            elif trade.product_type == "FX_OPTION":
                result = _price_fx_option(trade, market)
            elif trade.product_type == "COMMODITY_SWAP":
                result = _price_commodity_swap(trade, market)
            elif trade.product_type == "COMMODITY_FUTURE":
                result = _price_future(trade, market)
            else:
                raise PricingError(f"No model for {trade.product_type}")
        result.cashflows = [cf for cf in result.cashflows if date.fromisoformat(cf["date"]) >= market.as_of]
        return result
    except PricingError:
        raise
    except Exception as exc:  # QuantLib errors arrive as generic exceptions
        raise PricingError(f"Pricing failed for {trade.instrument_name or trade.product_type}: {exc}") from exc


def _finish(pv: float, currency: str, market: Market, model: str, explanation: str, measures: dict, cashflows: list, inputs: dict) -> PriceResult:
    return PriceResult(
        pv=pv,
        pv_currency=currency,
        pv_usd=to_usd(market, pv, currency),
        model=model,
        explanation=explanation,
        measures=measures,
        cashflows=cashflows,
        inputs=inputs,
    )


def _price_bond(trade: TradeView, market: Market) -> PriceResult:
    ccy = trade.notional_currency
    curve = get_curve(market, ccy)
    default_freq = "1Y" if ccy == "EUR" else "6M"
    freq = trade.pay_frequency if trade.pay_frequency in FREQ else default_freq
    dc = ql.Thirty360(ql.Thirty360.USA)
    schedule = _schedule(trade.start_date, trade.maturity_date, freq if freq in FREQ else "6M", ccy, backwards=True)
    coupon = float(trade.fixed_rate or 0.0)
    bond = ql.FixedRateBond(2, abs(trade.notional), schedule, [coupon], dc)
    bond.setPricingEngine(ql.DiscountingBondEngine(curve.handle))
    sign = direction_sign(trade.direction)
    pv = sign * float(bond.NPV())
    clean = float(bond.cleanPrice())
    dirty = float(bond.dirtyPrice())
    accrued = float(bond.accruedAmount())
    cashflows = []
    for cf in bond.cashflows():
        amount = sign * float(cf.amount())
        kind = "principal" if abs(abs(amount) - abs(trade.notional)) < 1.0 else "coupon"
        cashflows.append(_cf(date(cf.date().year(), cf.date().month(), cf.date().dayOfMonth()), amount, ccy, kind, False))
    explanation = (
        f"A fixed-rate bond is a stack of known coupons plus principal. "
        f"QuantLib discounts those cash flows on the {ccy} curve. "
        f"Clean price {clean:.3f} is the dirty price {dirty:.3f} minus accrued {accrued:.3f} per 100 face. "
        f"{'Long' if sign > 0 else 'Short'} {abs(trade.notional):,.0f} {ccy}, coupon {coupon * 100:.3f}%."
    )
    return _finish(
        pv,
        ccy,
        market,
        "QuantLib DiscountingBondEngine",
        explanation,
        {"clean_price": clean, "dirty_price": dirty, "accrued": accrued, "coupon": coupon},
        cashflows,
        {"currency": ccy, "coupon": coupon, "frequency": freq},
    )


def _price_irs(trade: TradeView, market: Market) -> PriceResult:
    ccy = trade.notional_currency
    curve = get_curve(market, ccy)
    freq = trade.pay_frequency if trade.pay_frequency in FREQ else ("1Y" if ccy == "EUR" else "6M")
    fixed_dc = ql.Thirty360(ql.Thirty360.USA)
    float_dc = ql.Actual360()
    fixed_sched = _schedule(trade.start_date, trade.maturity_date, freq, ccy)
    float_sched = _schedule(trade.start_date, trade.maturity_date, "6M", ccy)
    payer = trade.direction == "PAY"
    rate = float(trade.fixed_rate or 0.0)
    swap = ql.VanillaSwap(
        ql.VanillaSwap.Payer if payer else ql.VanillaSwap.Receiver,
        abs(trade.notional),
        fixed_sched,
        rate,
        fixed_dc,
        float_sched,
        curve.index,
        0.0,
        float_dc,
    )
    swap.setPricingEngine(ql.DiscountingSwapEngine(curve.handle))
    pv = float(swap.NPV())
    fair = float(swap.fairRate())
    fixed_sign = -1.0 if payer else 1.0
    cashflows = []
    for cf in list(swap.leg(0)):
        cashflows.append(
            _cf(
                date(cf.date().year(), cf.date().month(), cf.date().dayOfMonth()),
                fixed_sign * float(cf.amount()),
                ccy,
                "irs_fixed",
                False,
            )
        )
    for cf in list(swap.leg(1)):
        coupon = ql.as_floating_rate_coupon(cf)
        estimated = True
        if coupon is not None:
            estimated = not coupon.hasOccurred(to_ql(market.as_of))
        cashflows.append(
            _cf(
                date(cf.date().year(), cf.date().month(), cf.date().dayOfMonth()),
                -fixed_sign * float(cf.amount()),
                ccy,
                "irs_float",
                estimated,
            )
        )
    side = "pay fixed" if payer else "receive fixed"
    explanation = (
        f"A vanilla interest rate swap exchanges a fixed coupon for a floating coupon. "
        f"This trade will {side} at {rate * 100:.3f}% on {abs(trade.notional):,.0f} {ccy}. "
        f"The fair fixed rate on the bootstrapped {ccy} curve is {fair * 100:.3f}%. "
        f"Present value is the discounted difference between the two legs. "
        f"Floating amounts that have not fixed yet are estimates from the curve, not invoices."
    )
    return _finish(
        pv,
        ccy,
        market,
        "QuantLib VanillaSwap + PiecewiseLogCubicDiscount",
        explanation,
        {"fair_rate": fair, "fixed_rate": rate, "pay_fixed": payer},
        cashflows,
        {"currency": ccy, "fixed_rate": rate, "fair_rate": fair, "frequency": freq},
    )


def _price_fx(trade: TradeView, market: Market) -> PriceResult:
    pair = trade.underlying or ""
    if pair not in PAIR_CURRENCIES:
        raise PricingError("FX trade needs a pair such as EURUSD on the underlying field.")
    base, quote = PAIR_CURRENCIES[pair]
    spot = market.fx[pair]
    strike = float(trade.fixed_rate or spot)
    maturity = trade.maturity_date
    forward = fair_fx_forward(market, pair, maturity)
    df_quote = get_curve(market, quote).discount(maturity)
    sign = direction_sign(trade.direction)
    # PV in quote currency per 1 unit of base, times notional.
    pv_quote = sign * abs(trade.notional) * df_quote * (forward - strike)
    pv_usd = to_usd(market, pv_quote, quote)
    # Report PV in USD so mixed FX books add up, but keep quote currency on the cashflows.
    cashflows = []
    base_amt = sign * abs(trade.notional)
    quote_amt = -sign * abs(trade.notional) * strike
    cashflows.append(_cf(maturity, base_amt, base, "fx_base", False))
    cashflows.append(_cf(maturity, quote_amt, quote, "fx_quote", False))
    kind = "spot" if trade.product_type == "FX_SPOT" else "forward"
    explanation = (
        f"An FX {kind} agrees to exchange {base} for {quote} at {strike:.4f}. "
        f"Covered-interest parity says the fair outright is spot {spot:.4f} times "
        f"the {base} discount factor over the {quote} discount factor, which is {forward:.4f}. "
        f"Value in {quote} is notional times the discounted gap between that fair outright and the traded rate. "
        f"{'Buying' if sign > 0 else 'Selling'} {abs(trade.notional):,.0f} {base}."
    )
    return PriceResult(
        pv=pv_usd,
        pv_currency="USD",
        pv_usd=pv_usd,
        model="Covered-interest FX forward (QuantLib discount factors)",
        explanation=explanation,
        measures={"spot": spot, "fair_forward": forward, "traded_rate": strike, "df_quote": df_quote, "pv_quote": pv_quote},
        cashflows=cashflows,
        inputs={"pair": pair, "spot": spot, "fair_forward": forward, "rate": strike},
    )


def _option_units(trade: TradeView) -> tuple[float, float]:
    qty = trade.quantity if trade.quantity not in (None, 0) else trade.notional
    mult = trade.multiplier if trade.multiplier not in (None, 0) else 1.0
    return float(qty), float(mult)


def _price_equity_option(trade: TradeView, market: Market) -> PriceResult:
    ticker = trade.underlying or ""
    if ticker not in market.equities:
        raise PricingError(f"No equity market data for {ticker}")
    spot, vol, div, ccy, name = market.equities[ticker]
    strike = float(trade.strike or 0.0)
    call = (trade.option_type or "CALL") == "CALL"
    rate = get_curve(market, ccy).zero_continuous(trade.maturity_date)
    unit, delta, vega_abs = black_scholes_price(spot, strike, vol, rate, div, trade.maturity_date, market.as_of, call)
    qty, mult = _option_units(trade)
    sign = direction_sign(trade.direction)
    pv = sign * unit * qty * mult
    t = _year_fraction(market.as_of, trade.maturity_date)
    premium_cash = 0.0
    if trade.premium and trade.start_date >= market.as_of:
        premium_cash = -sign * float(trade.premium) * qty * mult
    cashflows = []
    if premium_cash and trade.start_date >= market.as_of:
        cashflows.append(_cf(trade.start_date, premium_cash, ccy, "premium", False))
    side = "call" if call else "put"
    explanation = (
        f"Black-Scholes-Merton prices a European {side} on {name}. "
        f"Spot {spot:.2f}, strike {strike:.2f}, volatility {vol * 100:.1f}%, "
        f"dividend yield {div * 100:.2f}%, and a {ccy} zero rate of {rate * 100:.2f}% to expiry "
        f"({t * 365:.0f} days). One option is worth {unit:.4f} {ccy}. "
        f"The trade multiplies by {qty:.0f} contracts times {mult:.0f}. "
        f"Delta {delta:.3f} is the share-equivalent of one option; vega is the price change for a 1.00 move in volatility."
    )
    return _finish(
        pv,
        ccy,
        market,
        "QuantLib AnalyticEuropeanEngine (Black-Scholes-Merton)",
        explanation,
        {
            "unit_price": unit,
            "delta": sign * delta,
            "vega": sign * vega_abs,
            "spot": spot,
            "vol": vol,
            "rate": rate,
            "dividend_yield": div,
        },
        cashflows,
        {"ticker": ticker, "spot": spot, "strike": strike, "vol": vol, "rate": rate, "dividend_yield": div},
    )


def _price_fx_option(trade: TradeView, market: Market) -> PriceResult:
    pair = trade.underlying or ""
    if pair not in PAIR_CURRENCIES:
        raise PricingError("FX option needs a pair on the underlying field.")
    base, quote = PAIR_CURRENCIES[pair]
    spot = market.fx[pair]
    strike = float(trade.strike or 0.0)
    vol = market.fx_vols[pair]
    call = (trade.option_type or "CALL") == "CALL"
    # Domestic is the quote currency (USD in EURUSD). Foreign yield is the base rate.
    rate = get_curve(market, quote).zero_continuous(trade.maturity_date)
    div = get_curve(market, base).zero_continuous(trade.maturity_date)
    unit, delta, vega_abs = black_scholes_price(spot, strike, vol, rate, div, trade.maturity_date, market.as_of, call)
    sign = direction_sign(trade.direction)
    notional = abs(trade.notional)
    pv_quote = sign * unit * notional
    pv_usd = to_usd(market, pv_quote, quote)
    cashflows = []
    if trade.premium and trade.start_date >= market.as_of:
        cashflows.append(_cf(trade.start_date, -sign * float(trade.premium) * notional, quote, "premium", False))
    side = "call" if call else "put"
    explanation = (
        f"A Garman-Kohlhagen FX {side} is Black-Scholes with two interest rates. "
        f"{pair} spot is {spot:.4f} and the strike is {strike:.4f}. "
        f"The quote-currency rate ({quote}, {rate * 100:.2f}%) is the discount rate, and the "
        f"base-currency rate ({base}, {div * 100:.2f}%) plays the role of the dividend. "
        f"ATM volatility is a flat {vol * 100:.1f}% — a real desk would use a delta-tenor surface. "
        f"Unit price {unit:.5f} {quote} per 1 {base}, times notional {notional:,.0f}."
    )
    return PriceResult(
        pv=pv_usd,
        pv_currency="USD",
        pv_usd=pv_usd,
        model="QuantLib Garman-Kohlhagen (Black-Scholes-Merton with two rates)",
        explanation=explanation,
        measures={"unit_price": unit, "delta": sign * delta, "vega": sign * vega_abs, "spot": spot, "vol": vol, "pv_quote": pv_quote},
        cashflows=cashflows,
        inputs={"pair": pair, "spot": spot, "strike": strike, "vol": vol, "domestic_rate": rate, "foreign_rate": div},
    )


def _settlement_dates(trade: TradeView, market: Market) -> list[date]:
    freq = trade.pay_frequency if trade.pay_frequency in FREQ else "3M"
    months = {"1M": 1, "3M": 3, "6M": 6, "1Y": 12}[freq]
    dates: list[date] = []
    cursor = trade.start_date
    # Walk period ends. Cap the loop so a bad frequency cannot run away.
    for _ in range(80):
        month = cursor.month - 1 + months
        year = cursor.year + month // 12
        month = month % 12 + 1
        day = min(cursor.day, 28)
        cursor = date(year, month, day)
        if cursor > trade.maturity_date + timedelta(days=5):
            break
        if cursor >= market.as_of and cursor <= trade.maturity_date + timedelta(days=5):
            # Snap the last date to maturity when we have passed it.
            if cursor > trade.maturity_date:
                dates.append(trade.maturity_date)
                break
            dates.append(cursor)
        if cursor >= trade.maturity_date:
            break
    if not dates and trade.maturity_date >= market.as_of:
        dates.append(trade.maturity_date)
    return dates


def _price_commodity_swap(trade: TradeView, market: Market) -> PriceResult:
    underlying = trade.underlying or ""
    if underlying not in market.commodities:
        raise PricingError(f"No commodity curve for {underlying}")
    ccy, unit, name = market.commodity_meta[underlying]
    fixed = float(trade.fixed_rate or 0.0)
    volume = abs(trade.notional)
    # PAY fixed receives floating: value rises when forwards rise.
    floating_sign = 1.0 if trade.direction == "PAY" else -1.0
    curve = get_curve(market, ccy)
    pv = 0.0
    cashflows = []
    forwards = []
    for when in _settlement_dates(trade, market):
        fwd = forward_price(market, underlying, when)
        forwards.append(fwd)
        amount = floating_sign * (fwd - fixed) * volume
        df = curve.discount(when)
        pv += df * amount
        cashflows.append(_cf(when, amount, ccy, "commodity_settlement", True))
    avg = sum(forwards) / len(forwards) if forwards else fixed
    side = "pay fixed / receive floating" if trade.direction == "PAY" else "receive fixed / pay floating"
    explanation = (
        f"A financial commodity swap on {name} settles (forward − fixed) times volume each period. "
        f"This trade will {side} at {fixed:.2f} {ccy}/{unit}, volume {volume:,.0f} {unit} per period. "
        f"Forwards are read off the stored curve (average of the remaining fixings {avg:.2f}) and "
        f"discounted on the {ccy} yield curve. Nothing here is a physical delivery."
    )
    return _finish(
        pv,
        ccy,
        market,
        "Discounted commodity forward curve",
        explanation,
        {"average_forward": avg, "fixed_price": fixed, "periods": len(forwards), "volume": volume},
        cashflows,
        {"underlying": underlying, "fixed": fixed, "average_forward": avg, "unit": unit},
    )


def _price_future(trade: TradeView, market: Market) -> PriceResult:
    underlying = trade.underlying or ""
    if underlying not in market.commodities:
        raise PricingError(f"No commodity curve for {underlying}")
    ccy, unit, name = market.commodity_meta[underlying]
    entry = float(trade.fixed_rate or 0.0)
    fwd = forward_price(market, underlying, trade.maturity_date)
    qty, mult = _option_units(trade)
    if trade.multiplier in (None, 0):
        mult = 1000.0 if underlying == "BRENT" else 1.0
    sign = direction_sign(trade.direction)
    pv = sign * (fwd - entry) * qty * mult
    cashflows = [
        _cf(trade.maturity_date, pv, ccy, "variation_margin", True),
    ]
    explanation = (
        f"A listed future on {name} is marked against the forward for {trade.maturity_date.isoformat()}, "
        f"which is {fwd:.2f} {ccy}/{unit}. The trade entered at {entry:.2f}. "
        f"Open trade P&L is (forward − entry) times {qty:.0f} lots times multiplier {mult:.0f}, undiscounted, "
        f"because variation margin is paid as the price moves rather than at final delivery. "
        f"The ladder shows that open amount on the contract date as one projected flow."
    )
    return _finish(
        pv,
        ccy,
        market,
        "Futures mark-to-market (undiscounted)",
        explanation,
        {"forward": fwd, "entry": entry, "lots": qty, "multiplier": mult},
        cashflows,
        {"underlying": underlying, "forward": fwd, "entry": entry},
    )


def is_live(trade: TradeView, as_of: date) -> bool:
    if trade.status == "CANCELLED":
        return False
    if trade.maturity_date < as_of:
        return False
    if trade.product_type in {"FX_SPOT", "FX_FORWARD"} and trade.maturity_date < as_of:
        return False
    return True


def premium_cash_usd(trade: TradeView, market: Market) -> float:
    """Signed cash paid for an option on the trade date. Positive means the book paid premium."""
    if not trade.premium or trade.product_type not in {"EQUITY_OPTION", "FX_OPTION"}:
        return 0.0
    sign = direction_sign(trade.direction)
    if trade.product_type == "EQUITY_OPTION":
        qty, mult = _option_units(trade)
        ccy = market.equities[trade.underlying or ""][3]
        amount = sign * float(trade.premium) * qty * mult
        return to_usd(market, amount, ccy)
    amount = sign * float(trade.premium) * abs(trade.notional)
    pair = trade.underlying or ""
    quote = PAIR_CURRENCIES[pair][1]
    return to_usd(market, amount, quote)


def view_from_model(trade) -> TradeView:
    return TradeView(
        product_type=trade.product_type,
        direction=trade.direction,
        notional=trade.notional,
        notional_currency=trade.notional_currency,
        secondary_currency=trade.secondary_currency,
        fixed_rate=trade.fixed_rate,
        strike=trade.strike,
        premium=trade.premium,
        quantity=trade.quantity,
        multiplier=trade.multiplier,
        underlying=trade.underlying,
        option_type=trade.option_type,
        instrument_name=trade.instrument_name,
        trade_date=trade.trade_date,
        start_date=trade.start_date,
        maturity_date=trade.maturity_date,
        pay_frequency=trade.pay_frequency or "6M",
        status=trade.status,
    )
