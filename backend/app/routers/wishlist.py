"""Wishlist routes. Adding is idempotent — re-adding an existing item is a no-op."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Listing, User, WishlistItem
from app.schemas import WishlistCreate, WishlistItemOut
from app.services.listing_service import get_review_stats, to_summary

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.post("", response_model=WishlistItemOut, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(payload: WishlistCreate, db: Session = Depends(get_db)) -> WishlistItemOut:
    if db.get(User, payload.user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    listing = db.scalars(
        select(Listing)
        .where(Listing.id == payload.listing_id)
        .options(selectinload(Listing.photos))
    ).first()
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")

    item = db.get(WishlistItem, (payload.user_id, payload.listing_id))
    if item is None:
        item = WishlistItem(user_id=payload.user_id, listing_id=payload.listing_id)
        db.add(item)
        db.commit()
        db.refresh(item)

    summary = to_summary(listing, get_review_stats(db, [listing.id]))
    return WishlistItemOut(
        user_id=item.user_id,
        listing_id=item.listing_id,
        created_at=item.created_at,
        listing=summary,
    )


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    listing_id: int, user_id: int = Query(...), db: Session = Depends(get_db)
) -> None:
    item = db.get(WishlistItem, (user_id, listing_id))
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Wishlist item not found")
    db.delete(item)
    db.commit()
