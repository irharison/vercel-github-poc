"""Persistence for the learning desk. One trade row, with product fields left null when they do not apply."""

from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    desk: Mapped[str] = mapped_column(String(64))
    base_currency: Mapped[str] = mapped_column(String(8))
    active: Mapped[int] = mapped_column(Integer, default=1)
    trades: Mapped[list["Trade"]] = relationship(back_populates="book")


class Counterparty(Base):
    __tablename__ = "counterparties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(64))
    city: Mapped[str] = mapped_column(String(64))
    active: Mapped[int] = mapped_column(Integer, default=1)
    trades: Mapped[list["Trade"]] = relationship(back_populates="counterparty")


class Currency(Base):
    __tablename__ = "currencies"

    code: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    minor_units: Mapped[int] = mapped_column(Integer, default=2)


class Calendar(Base):
    __tablename__ = "calendars"

    code: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    center: Mapped[str] = mapped_column(String(64))
    holidays: Mapped[list["Holiday"]] = relationship(back_populates="calendar")


class Holiday(Base):
    __tablename__ = "holidays"
    __table_args__ = (UniqueConstraint("calendar_code", "holiday_date", name="uq_holiday"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    calendar_code: Mapped[str] = mapped_column(ForeignKey("calendars.code"))
    holiday_date: Mapped[date] = mapped_column(Date, index=True)
    name: Mapped[str] = mapped_column(String(128))
    calendar: Mapped[Calendar] = relationship(back_populates="holidays")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trade_ref: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    product_type: Mapped[str] = mapped_column(String(32), index=True)
    instrument_name: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(16), index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    counterparty_id: Mapped[int] = mapped_column(ForeignKey("counterparties.id"))
    direction: Mapped[str] = mapped_column(String(16))
    notional: Mapped[float] = mapped_column(Float)
    notional_currency: Mapped[str] = mapped_column(String(8))
    secondary_currency: Mapped[str | None] = mapped_column(String(8), nullable=True)
    fixed_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    strike: Mapped[float | None] = mapped_column(Float, nullable=True)
    premium: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    multiplier: Mapped[float | None] = mapped_column(Float, nullable=True)
    underlying: Mapped[str | None] = mapped_column(String(32), nullable=True)
    option_type: Mapped[str | None] = mapped_column(String(8), nullable=True)
    trade_date: Mapped[date] = mapped_column(Date)
    start_date: Mapped[date] = mapped_column(Date)
    maturity_date: Mapped[date] = mapped_column(Date)
    pay_frequency: Mapped[str] = mapped_column(String(8), default="6M")
    trader: Mapped[str] = mapped_column(String(64), default="demo.user")
    notes: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)

    book: Mapped[Book] = relationship(back_populates="trades")
    counterparty: Mapped[Counterparty] = relationship(back_populates="trades")
    events: Mapped[list["TradeEvent"]] = relationship(back_populates="trade", order_by="TradeEvent.id")


class TradeEvent(Base):
    __tablename__ = "trade_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trade_id: Mapped[int] = mapped_column(ForeignKey("trades.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(40))
    from_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    to_status: Mapped[str] = mapped_column(String(16))
    actor: Mapped[str] = mapped_column(String(64))
    message: Mapped[str] = mapped_column(String(500), default="")
    payload: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    trade: Mapped[Trade] = relationship(back_populates="events")


class CurvePillar(Base):
    __tablename__ = "curve_pillars"
    __table_args__ = (UniqueConstraint("as_of", "currency", "tenor", name="uq_pillar"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of: Mapped[date] = mapped_column(Date, index=True)
    currency: Mapped[str] = mapped_column(String(8), index=True)
    tenor: Mapped[str] = mapped_column(String(8))
    pillar_type: Mapped[str] = mapped_column(String(16))
    rate: Mapped[float] = mapped_column(Float)


class FxSpot(Base):
    __tablename__ = "fx_spots"
    __table_args__ = (UniqueConstraint("as_of", "pair", name="uq_fx"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of: Mapped[date] = mapped_column(Date, index=True)
    pair: Mapped[str] = mapped_column(String(8))
    spot: Mapped[float] = mapped_column(Float)


class EquityQuote(Base):
    __tablename__ = "equity_quotes"
    __table_args__ = (UniqueConstraint("as_of", "ticker", name="uq_eq"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of: Mapped[date] = mapped_column(Date, index=True)
    ticker: Mapped[str] = mapped_column(String(16))
    name: Mapped[str] = mapped_column(String(128))
    currency: Mapped[str] = mapped_column(String(8))
    spot: Mapped[float] = mapped_column(Float)
    vol: Mapped[float] = mapped_column(Float)
    dividend_yield: Mapped[float] = mapped_column(Float)


class FxVol(Base):
    __tablename__ = "fx_vols"
    __table_args__ = (UniqueConstraint("as_of", "pair", name="uq_fxvol"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of: Mapped[date] = mapped_column(Date, index=True)
    pair: Mapped[str] = mapped_column(String(8))
    vol: Mapped[float] = mapped_column(Float)


class CommodityForward(Base):
    __tablename__ = "commodity_forwards"
    __table_args__ = (UniqueConstraint("as_of", "underlying", "tenor", name="uq_cmdty"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    as_of: Mapped[date] = mapped_column(Date, index=True)
    underlying: Mapped[str] = mapped_column(String(16))
    name: Mapped[str] = mapped_column(String(64))
    tenor: Mapped[str] = mapped_column(String(8))
    price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8))
    unit: Mapped[str] = mapped_column(String(16))


class FactorReturn(Base):
    __tablename__ = "factor_returns"
    __table_args__ = (UniqueConstraint("scenario_date", "factor", name="uq_factor"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scenario_date: Mapped[date] = mapped_column(Date, index=True)
    factor: Mapped[str] = mapped_column(String(32))
    value: Mapped[float] = mapped_column(Float)


class DeskUser(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(64), primary_key=True)
    password: Mapped[str] = mapped_column(String(128))
    display_name: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(32))


class SavedFilter(Base):
    __tablename__ = "filters"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    description: Mapped[str] = mapped_column(String(240), default="")
    criteria: Mapped[str] = mapped_column(Text, default="[]")


class CsaAgreement(Base):
    __tablename__ = "csa_agreements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    party_code: Mapped[str] = mapped_column(String(32))
    currency: Mapped[str] = mapped_column(String(8))
    threshold: Mapped[float] = mapped_column(Float, default=0)
    independent_amount: Mapped[float] = mapped_column(Float, default=0)
    active: Mapped[int] = mapped_column(Integer, default=1)


class PricingSetupRow(Base):
    __tablename__ = "pricing_setups"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    closing_name: Mapped[str] = mapped_column(String(64))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    description: Mapped[str] = mapped_column(String(240), default="")


class DeskTask(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[str] = mapped_column(String(32), default="Idle")
    description: Mapped[str] = mapped_column(String(300), default="")


class RateIndex(Base):
    __tablename__ = "rate_indexes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    currency: Mapped[str] = mapped_column(String(8))
    name: Mapped[str] = mapped_column(String(32))
    tenor: Mapped[str] = mapped_column(String(8))


class CurrencyPair(Base):
    __tablename__ = "currency_pairs"

    name: Mapped[str] = mapped_column(String(8), primary_key=True)
    primary: Mapped[str] = mapped_column(String(8))
    quoting: Mapped[str] = mapped_column(String(8))


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(String(128))
