"""User routes: list/detail (also serves the demo "current user" dropdown),
trips, and wishlist.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Booking, User, WishlistItem
from app.schemas import BookingOut, TripOut, UserOut, WishlistItemOut
from app.services.listing_service import get_review_stats, load_listings_with_photos, to_summary

router = APIRouter(prefix="/users", tags=["users"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return db.scalars(select(User).order_by(User.name)).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    return _get_user_or_404(db, user_id)


@router.get("/{user_id}/trips", response_model=list[TripOut])
def get_user_trips(user_id: int, db: Session = Depends(get_db)) -> list[TripOut]:
    _get_user_or_404(db, user_id)

    bookings = db.scalars(
        select(Booking).where(Booking.guest_id == user_id).order_by(Booking.check_in.desc())
    ).all()
    listings_by_id = load_listings_with_photos(db, [b.listing_id for b in bookings])
    stats = get_review_stats(db, list(listings_by_id))

    return [
        TripOut(
            **BookingOut.model_validate(booking).model_dump(),
            listing=to_summary(listings_by_id[booking.listing_id], stats),
        )
        for booking in bookings
    ]


@router.get("/{user_id}/wishlist", response_model=list[WishlistItemOut])
def get_user_wishlist(user_id: int, db: Session = Depends(get_db)) -> list[WishlistItemOut]:
    _get_user_or_404(db, user_id)

    items = db.scalars(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
    ).all()
    listings_by_id = load_listings_with_photos(db, [i.listing_id for i in items])
    stats = get_review_stats(db, list(listings_by_id))

    return [
        WishlistItemOut(
            user_id=item.user_id,
            listing_id=item.listing_id,
            created_at=item.created_at,
            listing=to_summary(listings_by_id[item.listing_id], stats),
        )
        for item in items
    ]
