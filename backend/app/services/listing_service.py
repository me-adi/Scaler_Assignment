"""Shared listing query helpers.

`ListingSummary` carries computed fields (rating, review_count, cover photo)
that don't exist as plain columns, so it can't be built via Pydantic's
automatic from_attributes conversion alone. These helpers are the one place
that computation happens — reused by the listings search/detail endpoints
and by the trips/wishlist endpoints on the users router, per CLAUDE.md's
"rating is computed at query time, not duplicated across endpoints" note.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Listing, Review
from app.schemas import ListingSummary

ReviewStats = dict[int, tuple[float | None, int]]


def get_review_stats(db: Session, listing_ids: list[int]) -> ReviewStats:
    if not listing_ids:
        return {}
    rows = db.execute(
        select(Review.listing_id, func.avg(Review.rating), func.count(Review.id))
        .where(Review.listing_id.in_(listing_ids))
        .group_by(Review.listing_id)
    ).all()
    return {
        listing_id: (round(avg_rating, 1) if avg_rating is not None else None, count)
        for listing_id, avg_rating, count in rows
    }


def to_summary(listing: Listing, stats: ReviewStats) -> ListingSummary:
    """Assumes `listing.photos` is already loaded (e.g. via selectinload)."""
    rating, review_count = stats.get(listing.id, (None, 0))
    cover_photo_url = listing.photos[0].url if listing.photos else None
    return ListingSummary(
        id=listing.id,
        host_id=listing.host_id,
        title=listing.title,
        property_type=listing.property_type,
        city=listing.city,
        country=listing.country,
        price_per_night=listing.price_per_night,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        baths=listing.baths,
        cover_photo_url=cover_photo_url,
        rating=rating,
        review_count=review_count,
    )


def to_summaries(db: Session, listings: list[Listing]) -> list[ListingSummary]:
    stats = get_review_stats(db, [listing.id for listing in listings])
    return [to_summary(listing, stats) for listing in listings]


def load_listings_with_photos(db: Session, listing_ids: list[int]) -> dict[int, Listing]:
    if not listing_ids:
        return {}
    stmt = (
        select(Listing)
        .where(Listing.id.in_(listing_ids))
        .options(selectinload(Listing.photos))
    )
    return {listing.id: listing for listing in db.scalars(stmt).all()}
