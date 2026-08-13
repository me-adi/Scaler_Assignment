"""Review routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking, Listing, Review, User
from app.schemas import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db)) -> Review:
    if db.get(Listing, payload.listing_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    if db.get(User, payload.guest_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Guest not found")

    if payload.booking_id is not None:
        booking = db.get(Booking, payload.booking_id)
        if booking is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
        if booking.listing_id != payload.listing_id or booking.guest_id != payload.guest_id:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Booking does not belong to this guest/listing",
            )
        if booking.status != "completed":
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "Can only review a completed booking"
            )
        if booking.review is not None:
            raise HTTPException(
                status.HTTP_409_CONFLICT, "This booking has already been reviewed"
            )

    review = Review(
        listing_id=payload.listing_id,
        booking_id=payload.booking_id,
        guest_id=payload.guest_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
