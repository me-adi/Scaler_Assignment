/**
 * Shared types mirroring the backend Pydantic schemas (`backend/app/schemas.py`).
 * Kept in sync manually — see CLAUDE.md.
 *
 * Pydantic `date`/`datetime` fields serialize to ISO strings over JSON, so
 * they're typed `string` here (`YYYY-MM-DD` / full ISO 8601) — parse with
 * date-fns at the point of use rather than assuming a `Date` object.
 */

export type UserRole = "guest" | "host";

export type BookingStatus = "confirmed" | "cancelled" | "completed";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserOut {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  is_superhost: boolean;
  created_at: string;
}

/** Lightweight user reference nested in listings/reviews/bookings. */
export interface UserSummary {
  id: number;
  name: string;
  avatar_url: string | null;
  is_superhost: boolean;
}

// ---------------------------------------------------------------------------
// Amenities
// ---------------------------------------------------------------------------

export interface AmenityOut {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingPhotoOut {
  id: number;
  url: string;
  sort_order: number;
}

/** Shape used in search results, host dashboard, and wishlist grids. */
export interface ListingSummary {
  id: number;
  host_id: number;
  title: string;
  property_type: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  cover_photo_url: string | null;
  rating: number | null;
  review_count: number;
}

export interface ListingDetail extends ListingSummary {
  description: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  host: UserSummary;
  photos: ListingPhotoOut[];
  amenities: AmenityOut[];
}

export interface PaginatedListings {
  items: ListingSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListingCreate {
  host_id: number;
  title: string;
  description: string;
  property_type: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  photo_urls?: string[];
  amenity_ids?: number[];
}

/** All fields optional — only provided fields are applied (PATCH-like). */
export interface ListingUpdate {
  title?: string;
  description?: string;
  property_type?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  price_per_night?: number;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  baths?: number;
  photo_urls?: string[];
  amenity_ids?: number[];
}

/** Query params for `GET /listings`. `host_id` isn't in CLAUDE.md's
 * documented param list — added for the host dashboard's "my listings" view. */
export interface ListingSearchParams {
  city?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  /** Comma-separated amenity names, all of which must be present. */
  amenities?: string;
  host_id?: number;
  page?: number;
  page_size?: number;
}

/** Date-range-only booking view for public calendar blocking. */
export interface ListingBookedRange {
  check_in: string;
  check_out: string;
  status: BookingStatus;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export interface BookingCreate {
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookingOut {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_rate: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
}

/** A booking as shown on the guest's "My Trips" page. */
export interface TripOut extends BookingOut {
  listing: ListingSummary;
}

/** A booking as shown on the host dashboard — every status, with who booked
 * it. Distinct from ListingBookedRange (public, confirmed-only, no guest
 * identity — used for calendar-blocking). */
export interface BookingWithGuestOut {
  id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_rate: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  guest: UserSummary;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface ReviewCreate {
  listing_id: number;
  guest_id: number;
  booking_id?: number | null;
  rating: number;
  comment?: string | null;
}

export interface ReviewOut {
  id: number;
  listing_id: number;
  booking_id: number | null;
  rating: number;
  comment: string | null;
  created_at: string;
  guest: UserSummary;
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export interface WishlistCreate {
  user_id: number;
  listing_id: number;
}

export interface WishlistItemOut {
  user_id: number;
  listing_id: number;
  created_at: string;
  listing: ListingSummary;
}
