"""Ticket checks. The rules follow ordinary market conventions for the products, not a published Orchestrade field list."""

from __future__ import annotations

from datetime import date

from app.marketdata import PAIR_CURRENCIES, Market

PRODUCTS = {
    "BOND",
    "IRS",
    "FX_SPOT",
    "FX_FORWARD",
    "EQUITY_OPTION",
    "FX_OPTION",
    "COMMODITY_SWAP",
    "COMMODITY_FUTURE",
}
DIRECTIONS = {"BUY", "SELL", "PAY", "RECEIVE"}
FREQUENCIES = {"1M", "3M", "6M", "1Y"}


class ValidationError(Exception):
    def __init__(self, errors: list[dict]):
        self.errors = errors
        super().__init__("; ".join(e["message"] for e in errors))


def _err(errors: list[dict], field: str, message: str) -> None:
    errors.append({"field": field, "message": message})


def validate_trade(payload, market: Market, as_of: date) -> None:
    errors: list[dict] = []
    product = payload.product_type
    if product not in PRODUCTS:
        _err(errors, "product_type", f"Product must be one of {', '.join(sorted(PRODUCTS))}.")
        raise ValidationError(errors)

    if payload.direction not in DIRECTIONS:
        _err(errors, "direction", "Direction must be BUY, SELL, PAY, or RECEIVE.")

    if product in {"BOND", "EQUITY_OPTION", "COMMODITY_FUTURE"} and payload.direction not in {"BUY", "SELL"}:
        _err(errors, "direction", f"{product} uses BUY or SELL.")
    if product == "IRS" and payload.direction not in {"PAY", "RECEIVE"}:
        _err(errors, "direction", "An interest rate swap is PAY fixed or RECEIVE fixed.")
    if product == "COMMODITY_SWAP" and payload.direction not in {"PAY", "RECEIVE"}:
        _err(errors, "direction", "A commodity swap is PAY fixed or RECEIVE fixed.")
    if product in {"FX_SPOT", "FX_FORWARD", "FX_OPTION"} and payload.direction not in {"BUY", "SELL"}:
        _err(errors, "direction", "FX direction is BUY or SELL of the base currency.")

    if payload.notional is None or payload.notional <= 0:
        _err(errors, "notional", "Notional must be greater than zero.")

    if not payload.instrument_name or not payload.instrument_name.strip():
        _err(errors, "instrument_name", "Give the trade a name you will recognise on the blotter.")

    if payload.pay_frequency and payload.pay_frequency not in FREQUENCIES:
        _err(errors, "pay_frequency", "Frequency must be 1M, 3M, 6M, or 1Y.")

    if payload.trade_date > payload.start_date and product not in {"BOND"}:
        _err(errors, "start_date", "Start / value date cannot be before the trade date.")
    if product != "FX_SPOT" and payload.maturity_date <= payload.start_date:
        _err(errors, "maturity_date", "Maturity must be after the start date.")
    if product == "FX_SPOT" and payload.maturity_date != payload.start_date:
        _err(errors, "maturity_date", "FX spot uses the same value date for start and maturity.")
    if payload.maturity_date < as_of and product not in {"FX_SPOT", "FX_FORWARD"}:
        _err(errors, "maturity_date", "Maturity is already in the past on the valuation date. Book a live trade.")

    if product in {"BOND", "IRS"}:
        if payload.fixed_rate is None:
            _err(errors, "fixed_rate", "Enter the coupon or the fixed rate as a decimal, for example 0.04 for 4%.")
        elif not -0.02 <= payload.fixed_rate <= 0.25:
            _err(errors, "fixed_rate", "Rate looks off. Use a decimal between -2% and 25%.")
        if payload.notional_currency not in market.curves:
            _err(errors, "notional_currency", "No yield curve is loaded for that currency.")

    if product in {"FX_SPOT", "FX_FORWARD", "FX_OPTION"}:
        pair = payload.underlying or ""
        if pair not in PAIR_CURRENCIES:
            _err(errors, "underlying", "Pick a pair: EURUSD, GBPUSD, or USDJPY.")
        else:
            base, quote = PAIR_CURRENCIES[pair]
            if payload.notional_currency != base:
                _err(errors, "notional_currency", f"{pair} notional is in {base}.")
            if payload.secondary_currency != quote:
                _err(errors, "secondary_currency", f"{pair} quote currency is {quote}.")
        if product != "FX_OPTION":
            if payload.fixed_rate is None or payload.fixed_rate <= 0:
                _err(errors, "fixed_rate", "Enter the traded FX rate.")
            elif pair in market.fx:
                spot = market.fx[pair]
                if not (spot * 0.5) <= payload.fixed_rate <= (spot * 1.5):
                    _err(errors, "fixed_rate", f"Rate is far from spot {spot:.4f}. Check the quotation.")

    if product in {"EQUITY_OPTION", "FX_OPTION"}:
        if payload.option_type not in {"CALL", "PUT"}:
            _err(errors, "option_type", "Option type is CALL or PUT.")
        if payload.strike is None or payload.strike <= 0:
            _err(errors, "strike", "Strike must be greater than zero.")
        if payload.premium is not None and payload.premium < 0:
            _err(errors, "premium", "Premium cannot be negative. Sells are a direction, not a negative premium.")

    if product == "EQUITY_OPTION":
        if payload.underlying not in market.equities:
            _err(errors, "underlying", "Underlying is not on the equity market-data screen.")
        else:
            ccy = market.equities[payload.underlying][3]
            if payload.notional_currency != ccy:
                _err(errors, "notional_currency", f"{payload.underlying} is priced in {ccy}.")
        qty = payload.quantity or 0
        if qty <= 0:
            _err(errors, "quantity", "Enter the number of option contracts.")
        if payload.multiplier is not None and payload.multiplier <= 0:
            _err(errors, "multiplier", "Multiplier must be positive. Equity contracts are usually 100.")

    if product == "FX_OPTION":
        if payload.premium is None:
            _err(errors, "premium", "Enter the premium in quote currency per unit of base (for example USD per EUR).")

    if product in {"COMMODITY_SWAP", "COMMODITY_FUTURE"}:
        if payload.underlying not in market.commodities:
            _err(errors, "underlying", "Underlying is not on the commodity curve.")
        else:
            ccy = market.commodity_meta[payload.underlying][0]
            if payload.notional_currency != ccy:
                _err(errors, "notional_currency", f"{payload.underlying} is quoted in {ccy}.")
        if payload.fixed_rate is None or payload.fixed_rate <= 0:
            label = "entry price" if product == "COMMODITY_FUTURE" else "fixed price"
            _err(errors, "fixed_rate", f"Enter the {label}.")
        if product == "COMMODITY_FUTURE":
            if (payload.quantity or 0) <= 0:
                _err(errors, "quantity", "Enter the number of lots.")
            if payload.multiplier is not None and payload.multiplier <= 0:
                _err(errors, "multiplier", "Multiplier must be positive.")

    if errors:
        raise ValidationError(errors)
