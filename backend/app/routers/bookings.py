"""Booking routes. Overlap validation lives in `app/services/booking_service.py`."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking, Listing, User
from app.schemas import BookingCreate, BookingOut
from app.services.booking_service import has_overlapping_confirmed_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)) -> Booking:
    listing = db.get(Listing, payload.listing_id)
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")

    guest = db.get(User, payload.guest_id)
    if guest is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Guest not found")

    if payload.check_out <= payload.check_in:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "check_out must be after check_in"
        )

    if payload.guests > listing.max_guests:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"This listing accommodates at most {listing.max_guests} guests",
        )

    if has_overlapping_confirmed_booking(db, listing.id, payload.check_in, payload.check_out):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Listing is not available for the selected dates"
        )

    nights = (payload.check_out - payload.check_in).days
    booking = Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        nightly_rate=listing.price_per_night,
        total_price=listing.price_per_night * nights,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
