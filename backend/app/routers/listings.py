"""Listing routes: search/filter/pagination, detail, host CRUD.

Also exposes `GET /listings/{id}/bookings` (calendar-blocking date ranges)
and `GET /listings/{id}/reviews`, since both are naturally nested under a
listing per CLAUDE.md's documented route shape.

`amenities_router` is a small addition beyond CLAUDE.md's literal route
list: the schema has an Amenity table and both search (`amenities` filter)
and listing create/update (`amenity_ids`) need a way to discover valid
amenities, so `GET /amenities` exposes the seeded list.
"""

from __future__ import annotations

import math
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.models import Amenity, Booking, Listing, ListingAmenity, ListingPhoto, Review, User
from app.schemas import (
    AmenityOut,
    BookingWithGuestOut,
    ListingBookedRange,
    ListingCreate,
    ListingDetail,
    ListingUpdate,
    PaginatedListings,
    ReviewOut,
)
from app.services.listing_service import get_review_stats, to_summaries, to_summary

router = APIRouter(prefix="/listings", tags=["listings"])
amenities_router = APIRouter(prefix="/amenities", tags=["amenities"])


def _get_listing_or_404(db: Session, listing_id: int) -> Listing:
    stmt = (
        select(Listing)
        .where(Listing.id == listing_id)
        .options(
            selectinload(Listing.photos),
            selectinload(Listing.amenities),
            joinedload(Listing.host),
        )
    )
    listing = db.scalars(stmt).first()
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    return listing


def _to_detail(db: Session, listing: Listing) -> ListingDetail:
    stats = get_review_stats(db, [listing.id])
    summary = to_summary(listing, stats)
    return ListingDetail(
        **summary.model_dump(),
        description=listing.description,
        latitude=listing.latitude,
        longitude=listing.longitude,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        host=listing.host,
        photos=listing.photos,
        amenities=listing.amenities,
    )


def _validate_amenity_ids(db: Session, amenity_ids: list[int]) -> None:
    if not amenity_ids:
        return
    found = set(db.scalars(select(Amenity.id).where(Amenity.id.in_(amenity_ids))))
    missing = set(amenity_ids) - found
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Unknown amenity ids: {sorted(missing)}",
        )


@router.get("", response_model=PaginatedListings)
def search_listings(
    city: str | None = Query(None),
    check_in: date | None = Query(None),
    check_out: date | None = Query(None),
    guests: int | None = Query(None, gt=0),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    property_type: str | None = Query(None),
    amenities: str | None = Query(None, description="Comma-separated amenity names"),
    host_id: int | None = Query(None, description="Not in CLAUDE.md's documented params — added for the host dashboard's 'my listings' view"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
) -> PaginatedListings:
    conditions = []

    if host_id is not None:
        conditions.append(Listing.host_id == host_id)
    if city:
        conditions.append(Listing.city.ilike(f"%{city}%"))
    if property_type:
        conditions.append(Listing.property_type == property_type)
    if guests is not None:
        conditions.append(Listing.max_guests >= guests)
    if min_price is not None:
        conditions.append(Listing.price_per_night >= min_price)
    if max_price is not None:
        conditions.append(Listing.price_per_night <= max_price)

    if amenities:
        names = [n.strip().lower() for n in amenities.split(",") if n.strip()]
        if names:
            matching = (
                select(ListingAmenity.listing_id)
                .join(Amenity, Amenity.id == ListingAmenity.amenity_id)
                .where(func.lower(Amenity.name).in_(names))
                .group_by(ListingAmenity.listing_id)
                .having(func.count(func.distinct(Amenity.id)) == len(names))
            )
            conditions.append(Listing.id.in_(matching))

    if check_in is not None or check_out is not None:
        if check_in is None or check_out is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "check_in and check_out must be provided together",
            )
        if check_out <= check_in:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "check_out must be after check_in"
            )
        unavailable = select(Booking.listing_id).where(
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        conditions.append(Listing.id.not_in(unavailable))

    total = db.scalar(select(func.count(Listing.id)).where(*conditions)) or 0

    stmt = (
        select(Listing)
        .where(*conditions)
        .options(selectinload(Listing.photos))
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    listings = db.scalars(stmt).all()

    return PaginatedListings(
        items=to_summaries(db, listings),
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=ListingDetail, status_code=status.HTTP_201_CREATED)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db)) -> ListingDetail:
    host = db.get(User, payload.host_id)
    if host is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Host not found")
    if host.role != "host":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "User is not a host")

    _validate_amenity_ids(db, payload.amenity_ids)

    listing = Listing(
        host_id=payload.host_id,
        title=payload.title,
        description=payload.description,
        property_type=payload.property_type,
        city=payload.city,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
        price_per_night=payload.price_per_night,
        max_guests=payload.max_guests,
        bedrooms=payload.bedrooms,
        beds=payload.beds,
        baths=payload.baths,
    )
    db.add(listing)
    db.flush()

    for i, url in enumerate(payload.photo_urls):
        db.add(ListingPhoto(listing_id=listing.id, url=url, sort_order=i))

    if payload.amenity_ids:
        listing.amenities = list(
            db.scalars(select(Amenity).where(Amenity.id.in_(payload.amenity_ids)))
        )

    db.commit()
    return _to_detail(db, _get_listing_or_404(db, listing.id))


@router.get("/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: int, db: Session = Depends(get_db)) -> ListingDetail:
    listing = _get_listing_or_404(db, listing_id)
    return _to_detail(db, listing)


@router.put("/{listing_id}", response_model=ListingDetail)
def update_listing(
    listing_id: int, payload: ListingUpdate, db: Session = Depends(get_db)
) -> ListingDetail:
    listing = _get_listing_or_404(db, listing_id)
    data = payload.model_dump(exclude_unset=True)

    photo_urls = data.pop("photo_urls", None)
    amenity_ids = data.pop("amenity_ids", None)

    for field, value in data.items():
        setattr(listing, field, value)

    if amenity_ids is not None:
        _validate_amenity_ids(db, amenity_ids)
        listing.amenities = (
            list(db.scalars(select(Amenity).where(Amenity.id.in_(amenity_ids))))
            if amenity_ids
            else []
        )

    if photo_urls is not None:
        db.execute(delete(ListingPhoto).where(ListingPhoto.listing_id == listing.id))
        db.flush()
        for i, url in enumerate(photo_urls):
            db.add(ListingPhoto(listing_id=listing.id, url=url, sort_order=i))

    db.commit()
    return _to_detail(db, _get_listing_or_404(db, listing_id))


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(listing_id: int, db: Session = Depends(get_db)) -> None:
    listing = db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    db.delete(listing)
    db.commit()


@router.get("/{listing_id}/bookings", response_model=list[ListingBookedRange])
def list_listing_bookings(listing_id: int, db: Session = Depends(get_db)) -> list[Booking]:
    if db.get(Listing, listing_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    stmt = (
        select(Booking)
        .where(Booking.listing_id == listing_id, Booking.status == "confirmed")
        .order_by(Booking.check_in)
    )
    return db.scalars(stmt).all()


@router.get("/{listing_id}/bookings/all", response_model=list[BookingWithGuestOut])
def list_listing_bookings_detailed(listing_id: int, db: Session = Depends(get_db)) -> list[Booking]:
    """Host-facing view: every booking (any status) with guest identity.

    Not authorization-checked against the caller (no real auth exists yet,
    per CLAUDE.md's mocked-auth design) — the frontend only links here from
    the host dashboard for the current mocked user's own listings.
    """
    if db.get(Listing, listing_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    stmt = (
        select(Booking)
        .where(Booking.listing_id == listing_id)
        .options(joinedload(Booking.guest))
        .order_by(Booking.check_in.desc())
    )
    return db.scalars(stmt).all()


@router.get("/{listing_id}/reviews", response_model=list[ReviewOut])
def list_listing_reviews(listing_id: int, db: Session = Depends(get_db)) -> list[Review]:
    if db.get(Listing, listing_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Listing not found")
    stmt = (
        select(Review)
        .where(Review.listing_id == listing_id)
        .options(joinedload(Review.guest))
        .order_by(Review.created_at.desc())
    )
    return db.scalars(stmt).all()


@amenities_router.get("", response_model=list[AmenityOut])
def list_amenities(db: Session = Depends(get_db)) -> list[Amenity]:
    return db.scalars(select(Amenity).order_by(Amenity.name)).all()
