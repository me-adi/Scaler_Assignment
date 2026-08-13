/**
 * Fetch wrappers for the FastAPI backend.
 *
 * Per CLAUDE.md all API calls go through this module — no raw `fetch`
 * scattered across components.
 */

import type {
  AmenityOut,
  BookingCreate,
  BookingOut,
  BookingWithGuestOut,
  ListingBookedRange,
  ListingCreate,
  ListingDetail,
  ListingSearchParams,
  ListingUpdate,
  PaginatedListings,
  ReviewCreate,
  ReviewOut,
  TripOut,
  UserOut,
  WishlistCreate,
  WishlistItemOut,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Drops undefined/null entries and stringifies the rest into a query string. */
function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    // Backend returns a consistent `{"detail": "message"}` error shape.
    const detail = await res
      .json()
      .then((body) => body?.detail)
      .catch(() => null);
    throw new ApiError(
      typeof detail === "string" ? detail : res.statusText,
      res.status,
    );
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export function getHealth() {
  return apiFetch<{ status: string }>("/health", { cache: "no-store" });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function getUsers() {
  return apiFetch<UserOut[]>("/users");
}

export function getUser(userId: number) {
  return apiFetch<UserOut>(`/users/${userId}`);
}

export function getUserTrips(userId: number) {
  return apiFetch<TripOut[]>(`/users/${userId}/trips`);
}

export function getUserWishlist(userId: number) {
  return apiFetch<WishlistItemOut[]>(`/users/${userId}/wishlist`);
}

// ---------------------------------------------------------------------------
// Amenities
// ---------------------------------------------------------------------------

export function getAmenities() {
  return apiFetch<AmenityOut[]>("/amenities");
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export function searchListings(params: ListingSearchParams = {}) {
  return apiFetch<PaginatedListings>(`/listings${toQueryString(params)}`);
}

export function getListing(listingId: number) {
  return apiFetch<ListingDetail>(`/listings/${listingId}`);
}

export function createListing(payload: ListingCreate) {
  return apiFetch<ListingDetail>("/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateListing(listingId: number, payload: ListingUpdate) {
  return apiFetch<ListingDetail>(`/listings/${listingId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteListing(listingId: number) {
  return apiFetch<void>(`/listings/${listingId}`, { method: "DELETE" });
}

export function getListingBookings(listingId: number) {
  return apiFetch<ListingBookedRange[]>(`/listings/${listingId}/bookings`, {
    cache: "no-store",
  });
}

/** Host-facing: every booking (any status) with guest identity. */
export function getListingBookingsDetailed(listingId: number) {
  return apiFetch<BookingWithGuestOut[]>(`/listings/${listingId}/bookings/all`, {
    cache: "no-store",
  });
}

export function getListingReviews(listingId: number) {
  return apiFetch<ReviewOut[]>(`/listings/${listingId}/reviews`);
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export function createBooking(payload: BookingCreate) {
  return apiFetch<BookingOut>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function createReview(payload: ReviewCreate) {
  return apiFetch<ReviewOut>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export function addToWishlist(payload: WishlistCreate) {
  return apiFetch<WishlistItemOut>("/wishlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeFromWishlist(listingId: number, userId: number) {
  return apiFetch<void>(
    `/wishlist/${listingId}${toQueryString({ user_id: userId })}`,
    { method: "DELETE" },
  );
}
