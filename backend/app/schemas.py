"""Request and response shapes. Field descriptions are the API lesson."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class TradeIn(BaseModel):
    """Economics of a ticket. JSON names follow the trade concepts in the public client: Party, Book, Product."""

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "ProductType": "IRS",
                "Product": "USD 2Y pay fixed 4.00%",
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
                "Notes": "Learning ticket",
            }
        },
    )

    product_type: str = Field(alias="ProductType", description="BOND, IRS, FX_SPOT, FX_FORWARD, EQUITY_OPTION, FX_OPTION, COMMODITY_SWAP, or COMMODITY_FUTURE.")
    instrument_name: str = Field(alias="Product", description="Name shown on the blotter. The real model nests a product object here.")
    book: str = Field(alias="Book", description="Book code, for example LN-RATES.")
    counterparty: str = Field(alias="Party", description="Party code. The real model calls the counterparty a party.")
    direction: str = Field(alias="Direction", description="BUY or SELL for bonds, FX, options, and futures. PAY or RECEIVE fixed for swaps.")
    notional: float = Field(alias="Notional", description="Face, base-currency amount, volume per period, or lots. The real trade also has Quantity.")
    notional_currency: str = Field(alias="SettleCurrency")
    secondary_currency: str | None = Field(default=None, alias="SecondaryCurrency", description="Quote currency for FX.")
    fixed_rate: float | None = Field(default=None, alias="FixedRate", description="Coupon, swap fixed rate, FX outright, commodity fixed price, or futures entry. Rates are decimals: 0.04 means 4%.")
    strike: float | None = Field(default=None, alias="Strike")
    premium: float | None = Field(default=None, alias="Premium", description="Option premium per unit.")
    quantity: float | None = Field(default=None, alias="ContractQuantity", description="Option contracts or futures lots.")
    multiplier: float | None = Field(default=None, alias="Multiplier")
    underlying: str | None = Field(default=None, alias="Underlying")
    option_type: str | None = Field(default=None, alias="OptionType", description="CALL or PUT.")
    trade_date: date = Field(alias="TradeTime")
    start_date: date = Field(alias="SettlementDate", description="Bond dated date, swap effective date, FX value date, or premium pay date.")
    maturity_date: date = Field(alias="Maturity")
    pay_frequency: str = Field(default="6M", alias="PayFrequency")
    trader: str = Field(default="desk", alias="Trader")
    notes: str = Field(default="", alias="Notes")


class TradePut(BaseModel):
    """PUT /api/Trades. An Action runs the teaching workflow. No Action means an amendment."""

    model_config = ConfigDict(populate_by_name=True)

    id: int = Field(alias="Id")
    action: str | None = Field(default=None, alias="Action", description="verify, confirm, settle, or cancel. Omit to amend economics.")
    message: str = Field(default="", alias="Message")
    product_type: str | None = Field(default=None, alias="ProductType")
    instrument_name: str | None = Field(default=None, alias="Product")
    book: str | None = Field(default=None, alias="Book")
    counterparty: str | None = Field(default=None, alias="Party")
    direction: str | None = Field(default=None, alias="Direction")
    notional: float | None = Field(default=None, alias="Notional")
    notional_currency: str | None = Field(default=None, alias="SettleCurrency")
    secondary_currency: str | None = Field(default=None, alias="SecondaryCurrency")
    fixed_rate: float | None = Field(default=None, alias="FixedRate")
    strike: float | None = Field(default=None, alias="Strike")
    premium: float | None = Field(default=None, alias="Premium")
    quantity: float | None = Field(default=None, alias="ContractQuantity")
    multiplier: float | None = Field(default=None, alias="Multiplier")
    underlying: str | None = Field(default=None, alias="Underlying")
    option_type: str | None = Field(default=None, alias="OptionType")
    trade_date: date | None = Field(default=None, alias="TradeTime")
    start_date: date | None = Field(default=None, alias="SettlementDate")
    maturity_date: date | None = Field(default=None, alias="Maturity")
    pay_frequency: str | None = Field(default=None, alias="PayFrequency")
    trader: str | None = Field(default=None, alias="Trader")
    notes: str | None = Field(default=None, alias="Notes")


class FilterCriterion(BaseModel):
    ElementType: str
    ElementCondition: str
    Values: list[str] = []


class FilterIn(BaseModel):
    Name: str
    Description: str = ""
    CriteriaList: list[FilterCriterion] = []


class PartyIn(BaseModel):
    Code: str
    Name: str
    Role: str = "Corporate"
    City: str = ""
    Active: bool = True


class BookIn(BaseModel):
    Code: str
    Name: str
    Desk: str
    BaseCurrency: str = "USD"
    Active: bool = True


class QuoteIn(BaseModel):
    QuoteName: str
    Value: float


class SaveQuotesIn(BaseModel):
    ClosingName: str
    Quotes: list[QuoteIn]


class CurvePillarIn(BaseModel):
    Tenor: str
    Instrument: str
    Rate: float


class SaveInterestCurveIn(BaseModel):
    Currency: str
    Name: str
    SetupName: str = "Official"
    Pillars: list[CurvePillarIn]


class CommodityPillarIn(BaseModel):
    Tenor: str
    Price: float


class SaveCommodityCurveIn(BaseModel):
    CommodityId: str
    CurveName: str | None = None
    SetupName: str = "Official"
    Pillars: list[CommodityPillarIn]


class CsaIn(BaseModel):
    Name: str
    Party: str
    Currency: str = "USD"
    Threshold: float = 0
    IndependentAmount: float = 0


class TaskPut(BaseModel):
    Name: str
    Status: str = "Run"


class TransitionIn(BaseModel):
    action: str = Field(description="verify, confirm, settle, or cancel.")
    actor: str = "demo.user"
    message: str = ""


class AmendIn(TradeIn):
    actor: str = "demo.user"
    message: str = ""


class CounterpartyIn(BaseModel):
    code: str
    name: str
    role: str = "Corporate"
    city: str = ""


class CounterpartyPatch(BaseModel):
    name: str | None = None
    role: str | None = None
    city: str | None = None
    active: bool | None = None


class BookIn(BaseModel):
    code: str
    name: str
    desk: str
    base_currency: str = "USD"


class BookPatch(BaseModel):
    name: str | None = None
    desk: str | None = None
    base_currency: str | None = None
    active: bool | None = None


class PillarIn(BaseModel):
    tenor: str
    pillar_type: str
    rate: float = Field(description="Decimal rate. 0.04 is 4%.")


class EquityIn(BaseModel):
    spot: float
    vol: float = Field(description="Absolute volatility. 0.20 is 20%.")
    dividend_yield: float


class CommodityPillarIn(BaseModel):
    tenor: str
    price: float


class MarketIn(BaseModel):
    curves: dict[str, list[PillarIn]]
    fx: dict[str, float]
    fx_vols: dict[str, float]
    equities: dict[str, EquityIn]
    commodities: dict[str, list[CommodityPillarIn]]


class ShockIn(BaseModel):
    name: str = "Custom"
    rate_bp: float = 0
    usd_strength_pct: float = Field(0, description="Positive means a stronger dollar: EURUSD down, USDJPY up.")
    equity_pct: float = 0
    vol_points: float = Field(0, description="Added to every volatility, in percentage points.")
    commodity_pct: float = 0
