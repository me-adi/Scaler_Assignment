"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { useState } from "react";

import { ApiError, createBooking } from "@/lib/api";
import type { ListingBookedRange, ListingDetail } from "@/lib/types";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "./Toast";

import BookingConfirmModal from "./BookingConfirmModal";
import DateRangePicker, { type DateRange } from "./DateRangePicker";
import { StarIcon } from "./icons";

/**
 * The sticky booking card: date/guest selection, price breakdown, and the
 * Reserve → mocked-checkout-confirmation → POST /bookings flow.
 */
export default function BookingSummary({
  listing,
  bookedRanges: initialBookedRanges,
}: {
  listing: ListingDetail;
  bookedRanges: ListingBookedRange[];
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [bookedRanges, setBookedRanges] = useState(initialBookedRanges);
  const [range, setRange] = useState<DateRange>({ checkIn: null, checkOut: null });
  const [guests, setGuests] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nights =
    range.checkIn && range.checkOut ? differenceInCalendarDays(range.checkOut, range.checkIn) : 0;
  const nightlyRate = Math.round(listing.price_per_night);
  const subtotal = nights > 0 ? nightlyRate * nights : 0;

  const isOwnListing = currentUser != null && currentUser.id === listing.host_id;
  const canReserve =
    nights > 0 && guests >= 1 && guests <= listing.max_guests && currentUser != null && !isOwnListing;

  async function handleConfirm() {
    const { checkIn, checkOut } = range;
    if (!currentUser || !checkIn || !checkOut) return;

    const checkInStr = format(checkIn, "yyyy-MM-dd");
    const checkOutStr = format(checkOut, "yyyy-MM-dd");

    setSubmitting(true);
    try {
      await createBooking({
        listing_id: listing.id,
        guest_id: currentUser.id,
        check_in: checkInStr,
        check_out: checkOutStr,
        guests,
      });

      showToast(
        `Booking confirmed — ${nights} night${nights === 1 ? "" : "s"} at ${listing.title}.`,
        "success",
      );
      // Reflect the new booking immediately so the calendar blocks it
      // without waiting on a refetch.
      setBookedRanges((prev) => [
        ...prev,
        { check_in: checkInStr, check_out: checkOutStr, status: "confirmed" },
      ]);
      setRange({ checkIn: null, checkOut: null });
      setShowConfirm(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast(
          "Those dates were just booked by someone else — please pick different dates.",
          "error",
        );
        setRange({ checkIn: null, checkOut: null });
      } else if (err instanceof ApiError) {
        showToast(err.message, "error");
      } else {
        showToast("Something went wrong creating your booking. Please try again.", "error");
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-6 shadow-lg">
      <div className="flex items-baseline justify-between">
        <p className="text-lg text-neutral-900">
          <span className="font-semibold">${nightlyRate}</span>{" "}
          <span className="text-neutral-500">night</span>
        </p>
        {listing.rating != null ? (
          <span className="flex items-center gap-1 text-sm text-neutral-900">
            <StarIcon className="h-3.5 w-3.5" />
            {listing.rating.toFixed(1)} · {listing.review_count} review
            {listing.review_count === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <DateRangePicker bookedRanges={bookedRanges} value={range} onChange={setRange} />
      </div>

      {range.checkIn && !range.checkOut ? (
        <p className="mt-2 text-xs text-neutral-500">Add a checkout date</p>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
          <span className="text-sm font-medium text-neutral-900">Guests</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease guests"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center text-sm text-neutral-900">{guests}</span>
            <button
              type="button"
              aria-label="Increase guests"
              onClick={() => setGuests((g) => Math.min(listing.max_guests, g + 1))}
              disabled={guests >= listing.max_guests}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-neutral-500">{listing.max_guests} guests maximum</p>
      </div>

      <button
        type="button"
        disabled={!canReserve}
        onClick={() => setShowConfirm(true)}
        className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        Reserve
      </button>

      {isOwnListing ? (
        <p className="mt-2 text-center text-xs text-neutral-500">
          You&apos;re the host of this listing
        </p>
      ) : !authLoading && !currentUser ? (
        <p className="mt-2 text-center text-xs text-neutral-500">
          Sign in as a guest to reserve
        </p>
      ) : (
        <p className="mt-2 text-center text-xs text-neutral-500">You won&apos;t be charged yet</p>
      )}

      {nights > 0 ? (
        <div className="mt-6 space-y-3 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between text-neutral-700">
            <span>
              ${nightlyRate} × {nights} night{nights === 1 ? "" : "s"}
            </span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 font-semibold text-neutral-900">
            <span>Total</span>
            <span>${subtotal}</span>
          </div>
        </div>
      ) : null}

      {currentUser && range.checkIn && range.checkOut ? (
        <BookingConfirmModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          submitting={submitting}
          listingTitle={listing.title}
          coverPhotoUrl={listing.cover_photo_url}
          checkIn={range.checkIn}
          checkOut={range.checkOut}
          nights={nights}
          guests={guests}
          nightlyRate={nightlyRate}
          subtotal={subtotal}
          guestName={currentUser.name}
        />
      ) : null}
    </div>
  );
}
