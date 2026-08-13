"""Idempotent seed script — run with `python -m app.seed` from `backend/`.

Clears every row and reinserts a fixed demo dataset (clear + reseed, per the
"Seed Data Requirements" section of CLAUDE.md), so it's safe to re-run at any
time. Booking dates are anchored to today's date rather than fixed calendar
dates, so "My Trips" and listing-detail calendar blocking always show a
believable past/upcoming mix regardless of when the script runs. Listing
content generation uses a fixed random seed, so the rest of the dataset is
identical across runs.

Image URLs point at picsum.photos (specific curated photo IDs — see
CURATED_PHOTO_IDS — not its `/seed/` random mode, which surfaced plenty of
photos that don't read as "a place you'd book," including some that render
as an almost-blank grey box) and pravatar.cc (seeded by email) — both are in
frontend/next.config.mjs's `images.remotePatterns` allowlist for next/image.
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy import delete, inspect

from app.database import SessionLocal, engine
from app.models import (
    Amenity,
    Booking,
    Listing,
    ListingAmenity,
    ListingPhoto,
    Review,
    User,
    WishlistItem,
)

random.seed(42)

AMENITY_NAMES = [
    "WiFi",
    "Kitchen",
    "Free parking",
    "Air conditioning",
    "Heating",
    "Washer",
    "Dryer",
    "TV",
    "Dedicated workspace",
    "Pool",
    "Hot tub",
    "Fireplace",
    "Gym",
    "EV charger",
    "Pets allowed",
    "BBQ grill",
]

def _user(name: str, email: str, role: str, is_superhost: bool = False) -> dict:
    return dict(
        name=name,
        email=email,
        role=role,
        is_superhost=is_superhost,
        avatar_url=f"https://i.pravatar.cc/150?u={email}",
    )


USERS = [
    _user("Amara Okafor", "amara.host@example.com", "host", is_superhost=True),
    _user("Liam Sato", "liam.host@example.com", "host"),
    _user("Priya Nair", "priya.host@example.com", "host", is_superhost=True),
    _user("Jonas Weber", "jonas.guest@example.com", "guest"),
    _user("Sofia Rossi", "sofia.guest@example.com", "guest"),
    _user("Malik Johnson", "malik.guest@example.com", "guest"),
]

# (city, country, approx latitude, approx longitude)
CITIES = [
    ("Lisbon", "Portugal", 38.7223, -9.1393),
    ("Kyoto", "Japan", 35.0116, 135.7681),
    ("Cape Town", "South Africa", -33.9249, 18.4241),
    ("Austin", "United States", 30.2672, -97.7431),
    ("Reykjavik", "Iceland", 64.1466, -21.9426),
    ("Melbourne", "Australia", -37.8136, 144.9631),
]

# picsum.photos' `/seed/{string}/` mode maps a seed to essentially a random
# photo from its whole catalog (closeups of forks, cat noses, screws, hazy
# near-blank skies — nothing lodging-appropriate). These are picsum photo
# IDs (via `/id/{id}/`, verified real by fetching picsum's own /v2/list API
# and eyeballing a contact sheet) hand-picked for looking plausible on a
# travel/stay site — views, cozy interiors, villages, architecture — with
# the "could pass as a blank grey box" ones filtered out.
CURATED_PHOTO_IDS = [
    0, 1, 3, 6, 8, 10, 11, 13, 14, 16, 17, 18, 19, 27, 28, 29, 37, 41, 42, 43,
    47, 48, 49, 50, 52, 54, 57, 58, 59, 106, 107, 109, 111, 116, 117, 118,
    122, 125, 126, 127, 128, 134, 142, 143, 146, 151, 153, 154, 162,
    163, 164, 165,
    # 148 was in the original pick but 404s from picsum itself (verified via
    # direct fetch, not our code) — dropped rather than left silently broken.
]

PROPERTY_TYPES = ["apartment", "house", "cabin", "loft", "villa", "cottage"]
# 9 adjectives against LISTINGS_PER_CITY=8 and PROPERTY_TYPES/SIZE_PROFILES'
# own 6-cycles deliberately don't share a period — otherwise position i and
# i+6 within a city block would land on the exact same adjective+type+size
# combo (6 divides 8's first repeat at +6), producing two near-identical
# listings per city instead of just a repeated property_type, which is
# realistic (a city legitimately has multiple apartments).
ADJECTIVES = [
    "Sunlit",
    "Cozy",
    "Modern",
    "Charming",
    "Serene",
    "Stylish",
    "Rustic",
    "Elegant",
    "Breezy",
]

# (max_guests, bedrooms, beds, baths, base_price)
SIZE_PROFILES = [
    (2, 1, 1, 1.0, 55),
    (4, 2, 2, 1.0, 85),
    (4, 2, 3, 1.5, 95),
    (6, 3, 4, 2.0, 140),
    (8, 4, 5, 3.0, 210),
    (2, 1, 1, 1.0, 60),
]

REVIEW_COMMENTS = [
    "Amazing stay, the place was spotless and the host was super responsive.",
    "Great location and exactly as described. Would book again.",
    "Comfortable beds and a beautiful view. Minor noise from the street at night.",
    "Loved the neighborhood — lots of cafes nearby. Check-in was seamless.",
    "Perfect for our trip. Well-stocked kitchen and fast WiFi.",
    "Cozy and clean, though a bit smaller than expected.",
    "Fantastic host, very responsive, gave excellent local recommendations.",
    "Beautiful space with great natural light. Highly recommend.",
]

# Enough per city that a horizontally-scrolling row of cards actually
# overflows its container and the prev/next buttons have something to do —
# 3 per city (the original count) fits on one screen at most widths.
LISTINGS_PER_CITY = 8
NUM_LISTINGS = len(CITIES) * LISTINGS_PER_CITY  # 48

# (guest_index, city_index, offset_within_city, start_offset_days_from_today, nights)
# Expressed relative to each city block (rather than a flat listing index)
# so it keeps spreading bookings across all 6 cities regardless of
# LISTINGS_PER_CITY — a flat index would've silently clustered every
# booking into the first couple of cities once this grew past 18 listings.
# Negative day-offsets => checkout already passed => status 'completed'.
# Positive day-offsets => checkout still ahead => status 'confirmed'.
BOOKING_PLAN = [
    (0, 0, 0, -45, 5),
    (0, 1, 0, 14, 4),
    (1, 0, 1, -30, 3),
    (1, 2, 0, 21, 6),
    (2, 0, 2, -60, 7),
    (2, 3, 0, 10, 3),
    (0, 4, 0, 40, 5),
    (1, 5, 0, -15, 2),
    (2, 5, 2, 5, 2),
    (0, 2, 1, -90, 10),
]


def reset_db(session) -> None:
    """Delete all rows, children first, so re-running leaves a clean slate."""
    for model in (Review, WishlistItem, Booking, ListingAmenity, ListingPhoto, Listing, Amenity, User):
        session.execute(delete(model))


def create_users(session) -> list[User]:
    users = [User(**data) for data in USERS]
    session.add_all(users)
    session.flush()
    return users


def create_amenities(session) -> list[Amenity]:
    amenities = [Amenity(name=name) for name in AMENITY_NAMES]
    session.add_all(amenities)
    session.flush()
    return amenities


def build_listing(index: int, host: User, city_info: tuple[str, str, float, float]) -> Listing:
    city, country, lat, lon = city_info
    property_type = PROPERTY_TYPES[index % len(PROPERTY_TYPES)]
    adjective = ADJECTIVES[index % len(ADJECTIVES)]
    max_guests, bedrooms, beds, baths, base_price = SIZE_PROFILES[index % len(SIZE_PROFILES)]
    price = base_price + random.randint(-10, 30)

    title = f"{adjective} {property_type.title()} in {city}"
    description = (
        f"A {adjective.lower()} {property_type} in the heart of {city}, {country}. "
        f"Sleeps {max_guests} across {bedrooms} bedroom(s) with {beds} bed(s) and "
        f"{baths:g} bath(s) — perfect for "
        f"{'a quiet getaway' if max_guests <= 2 else 'groups and families'}."
    )

    return Listing(
        host_id=host.id,
        title=title,
        description=description,
        property_type=property_type,
        city=city,
        country=country,
        # Small jitter so listings in the same city don't all share one point.
        latitude=lat + random.uniform(-0.03, 0.03),
        longitude=lon + random.uniform(-0.03, 0.03),
        price_per_night=float(price),
        max_guests=max_guests,
        bedrooms=bedrooms,
        beds=beds,
        baths=baths,
    )


def create_listings(session, hosts: list[User], amenities: list[Amenity]) -> list[Listing]:
    listings: list[Listing] = []
    index = 0
    for city_info in CITIES:
        for _ in range(LISTINGS_PER_CITY):
            host = hosts[index % len(hosts)]
            listing = build_listing(index, host, city_info)
            listing.amenities = random.sample(amenities, k=random.randint(4, 8))
            listings.append(listing)
            index += 1

    session.add_all(listings)
    session.flush()

    for i, listing in enumerate(listings):
        photo_count = random.randint(3, 5)
        photos = [
            ListingPhoto(
                listing_id=listing.id,
                url=f"https://picsum.photos/id/{CURATED_PHOTO_IDS[(i * 5 + p) % len(CURATED_PHOTO_IDS)]}/900/600",
                sort_order=p,
            )
            for p in range(photo_count)
        ]
        session.add_all(photos)

    session.flush()
    return listings


def create_bookings(session, guests: list[User], listings: list[Listing]) -> list[Booking]:
    today = date.today()
    bookings: list[Booking] = []

    for guest_index, city_index, city_offset, start_offset, nights in BOOKING_PLAN:
        guest = guests[guest_index]
        listing = listings[city_index * LISTINGS_PER_CITY + city_offset]
        check_in = today + timedelta(days=start_offset)
        check_out = check_in + timedelta(days=nights)
        status = "completed" if check_out <= today else "confirmed"

        booking = Booking(
            listing_id=listing.id,
            guest_id=guest.id,
            check_in=check_in,
            check_out=check_out,
            guests=random.randint(1, listing.max_guests),
            nightly_rate=listing.price_per_night,
            total_price=listing.price_per_night * nights,
            status=status,
        )
        bookings.append(booking)

    session.add_all(bookings)
    session.flush()
    return bookings


def create_reviews(session, guests: list[User], listings: list[Listing], bookings: list[Booking]) -> None:
    bookings_by_listing: dict[int, list[Booking]] = {}
    for booking in bookings:
        if booking.status == "completed":
            bookings_by_listing.setdefault(booking.listing_id, []).append(booking)

    reviews: list[Review] = []
    for listing in listings:
        reviewers_used: set[int] = set()

        for booking in bookings_by_listing.get(listing.id, []):
            reviews.append(
                Review(
                    listing_id=listing.id,
                    booking_id=booking.id,
                    guest_id=booking.guest_id,
                    rating=random.choice([4, 5, 5]),
                    comment=random.choice(REVIEW_COMMENTS),
                )
            )
            reviewers_used.add(booking.guest_id)

        target_count = random.randint(2, 4)
        candidates = [g for g in guests if g.id not in reviewers_used]
        random.shuffle(candidates)
        for guest in candidates:
            if len(reviewers_used) >= target_count or not candidates:
                break
            reviews.append(
                Review(
                    listing_id=listing.id,
                    guest_id=guest.id,
                    rating=random.choice([3, 4, 4, 5, 5]),
                    comment=random.choice(REVIEW_COMMENTS),
                )
            )
            reviewers_used.add(guest.id)

    session.add_all(reviews)
    session.flush()


def ensure_schema_exists() -> None:
    if not inspect(engine).has_table("users"):
        raise SystemExit(
            "Database schema not found — run `alembic upgrade head` in backend/ first."
        )


def main() -> None:
    ensure_schema_exists()
    session = SessionLocal()
    try:
        reset_db(session)
        users = create_users(session)
        hosts = [u for u in users if u.role == "host"]
        guests = [u for u in users if u.role == "guest"]

        amenities = create_amenities(session)
        listings = create_listings(session, hosts, amenities)
        bookings = create_bookings(session, guests, listings)
        create_reviews(session, guests, listings, bookings)

        session.commit()
        print(
            f"Seeded {len(users)} users ({len(hosts)} host, {len(guests)} guest), "
            f"{len(listings)} listings, {len(amenities)} amenities, "
            f"{len(bookings)} bookings."
        )
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
