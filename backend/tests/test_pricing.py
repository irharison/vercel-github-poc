"""Sanity checks against known values, plus a few sign checks on the desk pricers."""

from datetime import date

import pytest

from app.marketdata import Market, fair_fx_forward
from app.pricing import TradeView, black_scholes_price, price_trade


def test_black_scholes_atm_call_matches_textbook():
    # Hull-style case: S=K=100, r=5%, q=0, sigma=20%, T=1. Price is about 10.4506.
    price, delta, vega = black_scholes_price(
        spot=100,
        strike=100,
        vol=0.20,
        rate=0.05,
        div=0.0,
        expiry=date(2027, 9, 25),
        valuation=date(2026, 9, 25),
        call=True,
    )
    assert price == pytest.approx(10.450583572185565, abs=1e-6)
    assert 0.6 < delta < 0.7
    assert vega > 0


def test_put_call_parity():
    kwargs = dict(spot=100, strike=100, vol=0.20, rate=0.05, div=0.02, expiry=date(2027, 9, 25), valuation=date(2026, 9, 25))
    call, _, _ = black_scholes_price(call=True, **kwargs)
    put, _, _ = black_scholes_price(call=False, **kwargs)
    import math

    forward_diff = 100 * math.exp(-0.02) - 100 * math.exp(-0.05)
    assert call - put == pytest.approx(forward_diff, abs=1e-6)


def _flat_market() -> Market:
    pillars = (
        ("1M", "deposit", 0.04),
        ("3M", "deposit", 0.04),
        ("6M", "deposit", 0.04),
        ("1Y", "swap", 0.04),
        ("2Y", "swap", 0.04),
        ("5Y", "swap", 0.04),
        ("10Y", "swap", 0.04),
        ("30Y", "swap", 0.04),
    )
    return Market(
        as_of=date(2026, 9, 25),
        curves={"USD": pillars, "EUR": pillars, "GBP": pillars, "JPY": pillars},
        fx={"EURUSD": 1.10, "GBPUSD": 1.30, "USDJPY": 150.0},
        equities={"AETHER": (100.0, 0.20, 0.0, "USD", "Aether Robotics")},
        fx_vols={"EURUSD": 0.10, "GBPUSD": 0.10, "USDJPY": 0.10},
        commodities={
            "BRENT": (("1M", 80.0), ("3M", 80.0), ("6M", 80.0), ("1Y", 80.0)),
        },
        commodity_meta={"BRENT": ("USD", "bbl", "Brent crude")},
    )


def test_fx_forward_at_fair_strike_is_flat():
    market = _flat_market()
    maturity = date(2027, 3, 25)
    fair = fair_fx_forward(market, "EURUSD", maturity)
    trade = TradeView(
        product_type="FX_FORWARD",
        direction="BUY",
        notional=10_000_000,
        notional_currency="EUR",
        secondary_currency="USD",
        underlying="EURUSD",
        fixed_rate=fair,
        trade_date=market.as_of,
        start_date=market.as_of,
        maturity_date=maturity,
    )
    result = price_trade(trade, market)
    assert result.pv_usd == pytest.approx(0.0, abs=1.0)


def test_long_bond_dv01_positive_and_short_is_negative():
    from app.analytics import sensitivities_for

    market = _flat_market()
    long = TradeView(
        product_type="BOND",
        direction="BUY",
        notional=1_000_000,
        notional_currency="USD",
        fixed_rate=0.04,
        trade_date=date(2026, 1, 15),
        start_date=date(2026, 1, 15),
        maturity_date=date(2031, 1, 15),
        pay_frequency="6M",
        instrument_name="Test 4.00",
    )
    short = TradeView(**{**long.__dict__, "direction": "SELL"})
    assert sensitivities_for(long, market)["dv01"] > 0
    assert sensitivities_for(short, market)["dv01"] < 0


def test_payer_swap_has_negative_dv01():
    from app.analytics import sensitivities_for

    market = _flat_market()
    trade = TradeView(
        product_type="IRS",
        direction="PAY",
        notional=10_000_000,
        notional_currency="USD",
        fixed_rate=0.04,
        trade_date=market.as_of,
        start_date=date(2026, 9, 29),
        maturity_date=date(2031, 9, 29),
        pay_frequency="6M",
    )
    sens = sensitivities_for(trade, market)
    assert sens["dv01"] < 0
    priced = price_trade(trade, market)
    # Struck at the flat pillar rate, so value should be small versus notional.
    assert abs(priced.pv) < 10_000


def test_commodity_swap_flat_forward_is_near_zero_and_payer_gains_if_fixed_is_lower():
    market = _flat_market()
    common = dict(
        product_type="COMMODITY_SWAP",
        notional=1_000,
        notional_currency="USD",
        underlying="BRENT",
        trade_date=market.as_of,
        start_date=date(2026, 10, 1),
        maturity_date=date(2027, 1, 1),
        pay_frequency="3M",
    )
    flat = TradeView(direction="PAY", fixed_rate=80.0, **common)
    cheap = TradeView(direction="PAY", fixed_rate=70.0, **common)
    assert price_trade(flat, market).pv == pytest.approx(0.0, abs=1.0)
    assert price_trade(cheap, market).pv > 1000


def test_futures_mark_to_market():
    market = _flat_market()
    trade = TradeView(
        product_type="COMMODITY_FUTURE",
        direction="BUY",
        notional=10,
        quantity=10,
        multiplier=1000,
        notional_currency="USD",
        underlying="BRENT",
        fixed_rate=78.0,
        trade_date=market.as_of,
        start_date=market.as_of,
        maturity_date=date(2026, 12, 16),
    )
    result = price_trade(trade, market)
    # Flat curve at 80, so (80-78) * 10 * 1000.
    assert result.pv == pytest.approx(20_000, abs=1.0)
    assert result.measures["forward"] == pytest.approx(80.0, abs=0.05)
