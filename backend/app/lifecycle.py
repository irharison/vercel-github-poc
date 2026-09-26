"""Trade status machine.

Booked → Verified → Confirmed → Settled, with Cancel from any open state.
Amend is not a resting status: economics change, an AMENDED event is stored,
and the trade returns to Booked so it has to be checked again.

The public Orchestrade material describes confirmation, settlement, and business
events (exercise, assignment, termination, novation). It does not publish this
diagram. Verified is a teaching step for an internal check before confirmation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.models import Trade, TradeEvent

# Event type strings follow the Derivitec snapshot where one exists.
# Verified and Confirmed are teaching steps; that snapshot has no such names.
TRANSITIONS = {
    "verify": ({"BOOKED"}, "VERIFIED", "Verified"),
    "confirm": ({"VERIFIED"}, "CONFIRMED", "Confirmed"),
    "settle": ({"CONFIRMED"}, "SETTLED", "SettlementEvent"),
    "cancel": ({"BOOKED", "VERIFIED", "CONFIRMED"}, "CANCELLED", "TerminationEvent"),
}

AMENDABLE = {"BOOKED", "VERIFIED", "CONFIRMED"}

SNAPSHOT_FIELDS = [
    "product_type",
    "instrument_name",
    "direction",
    "notional",
    "notional_currency",
    "secondary_currency",
    "fixed_rate",
    "strike",
    "premium",
    "quantity",
    "multiplier",
    "underlying",
    "option_type",
    "trade_date",
    "start_date",
    "maturity_date",
    "pay_frequency",
    "trader",
    "notes",
    "book_id",
    "counterparty_id",
    "status",
]


class LifecycleError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def snapshot(trade: Trade) -> dict:
    out = {}
    for name in SNAPSHOT_FIELDS:
        value = getattr(trade, name)
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        out[name] = value
    return out


def diff_snapshots(before: dict, after: dict) -> dict:
    changed = {}
    for key, value in after.items():
        if before.get(key) != value:
            changed[key] = {"from": before.get(key), "to": value}
    return changed


def record_event(
    trade: Trade,
    event_type: str,
    from_status: str | None,
    to_status: str,
    actor: str,
    message: str,
    payload: dict | None = None,
    when: datetime | None = None,
) -> TradeEvent:
    event = TradeEvent(
        trade=trade,
        event_type=event_type,
        from_status=from_status,
        to_status=to_status,
        actor=actor,
        message=message,
        payload=json.dumps(payload or {}, default=str),
        created_at=when or utcnow(),
    )
    return event


def transition(trade: Trade, action: str, actor: str, message: str = "") -> TradeEvent:
    action = action.lower().strip()
    if action not in TRANSITIONS:
        known = ", ".join(sorted(TRANSITIONS))
        raise LifecycleError(f"Unknown action '{action}'. Use one of: {known}.")
    allowed, new_status, event_type = TRANSITIONS[action]
    if trade.status not in allowed:
        raise LifecycleError(
            f"Cannot {action} a trade that is {trade.status}. "
            f"That action is only allowed from {' or '.join(sorted(allowed))}."
        )
    previous = trade.status
    trade.status = new_status
    trade.updated_at = utcnow()
    return record_event(
        trade,
        event_type,
        previous,
        new_status,
        actor,
        message or f"{action.capitalize()} by {actor}.",
        {"Action": action},
    )


def begin_amendment(trade: Trade, actor: str, before: dict, after: dict, message: str) -> TradeEvent:
    if trade.status not in AMENDABLE:
        raise LifecycleError(
            "Only booked, verified, or confirmed trades can be amended. "
            "Settled and cancelled trades are closed."
        )
    previous = trade.status
    trade.status = "BOOKED"
    trade.updated_at = utcnow()
    changed = diff_snapshots(before, after)
    changed.pop("status", None)
    return record_event(
        trade,
        "AmendEvent",
        previous,
        "BOOKED",
        actor,
        message or "Economics amended. Status reset to Booked so the trade is checked again.",
        {"changes": changed},
    )
