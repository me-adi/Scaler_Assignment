"""Pydantic request/response schemas.

Kept manually in sync with `frontend/lib/types.ts` (see CLAUDE.md). Response
models never expose SQLAlchemy objects directly — routers return these.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UserRole = Literal["guest", "host"]
BookingStatus = Literal["confirmed", "cancelled", "completed"]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: UserRole
    avatar_url: str | None
    is_superhost: bool
    created_at: datetime


class UserSummary(BaseModel):
    """Lightweight user reference nested in listings/reviews/bookings."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_url: str | None
    is_superhost: bool


# ---------------------------------------------------------------------------
# Amenities
# ---------------------------------------------------------------------------


class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ---------------------------------------------------------------------------
# Listings
# ---------------------------------------------------------------------------


class ListingPhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    sort_order: int


class ListingSummary(BaseModel):
    """Shape used in search results, host dashboard, and wishlist grids."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    title: str
    property_type: str
    city: str
    country: str
    latitude: float | None
    longitude: float | None
    price_per_night: float
    max_guests: int
    bedrooms: int
    beds: int
    baths: float
    cover_photo_url: str | None
    rating: float | None
    review_count: int


class ListingDetail(ListingSummary):
    description: str
    created_at: datetime
    updated_at: datetime
    host: UserSummary
    photos: list[ListingPhotoOut]
    amenities: list[AmenityOut]


class PaginatedListings(BaseModel):
    items: list[ListingSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class ListingCreate(BaseModel):
    host_id: int
    title: str
    description: str
    property_type: str
    city: str
    country: str
    latitude: float | None = None
    longitude: float | None = None
    price_per_night: float = Field(gt=0)
    max_guests: int = Field(gt=0)
    bedrooms: int = Field(ge=0)
    beds: int = Field(ge=0)
    baths: float = Field(ge=0)
    photo_urls: list[str] = Field(default_factory=list)
    amenity_ids: list[int] = Field(default_factory=list)


class ListingUpdate(BaseModel):
    """All fields optional — only provided fields are applied (PATCH-like)."""

    title: str | None = None
    description: str | None = None
    property_type: str | None = None
    city: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    price_per_night: float | None = Field(default=None, gt=0)
    max_guests: int | None = Field(default=None, gt=0)
    bedrooms: int | None = Field(default=None, ge=0)
    beds: int | None = Field(default=None, ge=0)
    baths: float | None = Field(default=None, ge=0)
    photo_urls: list[str] | None = None
    amenity_ids: list[int] | None = None


class ListingBookedRange(BaseModel):
    """Date-range-only booking view for public calendar blocking."""

    model_config = ConfigDict(from_attributes=True)

    check_in: date
    check_out: date
    status: BookingStatus


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int = Field(gt=0)


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    nightly_rate: float
    total_price: float
    status: BookingStatus
    created_at: datetime


class TripOut(BookingOut):
    """A booking as shown on the guest's "My Trips" page."""

    listing: ListingSummary


class BookingWithGuestOut(BaseModel):
    """A booking as shown on the host dashboard — every status, with who
    booked it. Distinct from `ListingBookedRange` (public, confirmed-only,
    no guest identity — used for calendar-blocking) since a host reasonably
    needs to see more than a guest browsing the listing does."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    check_in: date
    check_out: date
    guests: int
    nightly_rate: float
    total_price: float
    status: BookingStatus
    created_at: datetime
    guest: UserSummary


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------


class ReviewCreate(BaseModel):
    listing_id: int
    guest_id: int
    booking_id: int | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    booking_id: int | None
    rating: int
    comment: str | None
    created_at: datetime
    guest: UserSummary


# ---------------------------------------------------------------------------
# Wishlist
# ---------------------------------------------------------------------------


class WishlistCreate(BaseModel):
    user_id: int
    listing_id: int


class WishlistItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    listing_id: int
    created_at: datetime
    listing: ListingSummary
