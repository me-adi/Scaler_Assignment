"""Booking overlap validation — the single place this logic lives, per CLAUDE.md.

Only 'confirmed' bookings block dates; 'cancelled' and 'completed' don't.
"""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Booking


def has_overlapping_confirmed_booking(
    db: Session, listing_id: int, check_in: date, check_out: date
) -> bool:
    stmt = (
        select(Booking.id)
        .where(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        .limit(1)
    )
    return db.scalar(stmt) is not None
