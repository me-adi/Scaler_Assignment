"use client";

import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { getListingBookingsDetailed } from "@/lib/api";
import type { BookingWithGuestOut, ListingSummary } from "@/lib/types";

const STATUS_STYLES: Record<BookingWithGuestOut["status"], string> = {
  confirmed: "bg-neutral-900 text-white",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-50 text-red-600",
};

export default function HostListingRow({
  listing,
  onDelete,
}: {
  listing: ListingSummary;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [bookings, setBookings] = useState<BookingWithGuestOut[] | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState(false);

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    if (next && bookings === null) {
      setLoadingBookings(true);
      setBookingsError(false);
      getListingBookingsDetailed(listing.id)
        .then(setBookings)
        .catch(() => setBookingsError(true))
        .finally(() => setLoadingBookings(false));
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-24 sm:w-24">
          {listing.cover_photo_url ? (
            <Image
              src={listing.cover_photo_url}
              alt={listing.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-neutral-900">{listing.title}</p>
          <p className="text-sm text-neutral-500">
            {listing.city}, {listing.country}
          </p>
          <p className="mt-1 text-sm text-neutral-900">
            <span className="font-semibold">${Math.round(listing.price_per_night)}</span>{" "}
            <span className="text-neutral-500">night</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Link
            href={`/host/listings/${listing.id}/edit`}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleExpanded}
        className="mt-3 text-sm font-medium text-neutral-700 underline hover:text-neutral-900"
      >
        {expanded ? "Hide bookings" : "View bookings"}
      </button>

      {expanded ? (
        <div className="mt-3 border-t border-neutral-200 pt-3">
          {loadingBookings ? (
            <p className="text-sm text-neutral-500">Loading bookings…</p>
          ) : bookingsError ? (
            <p className="text-sm text-neutral-500">Couldn&apos;t load bookings for this listing.</p>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-neutral-900">{b.guest.name}</span>
                    <span className="shrink-0 text-neutral-500">
                      {format(parseISO(b.check_in), "MMM d")} –{" "}
                      {format(parseISO(b.check_out), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-neutral-900">${Math.round(b.total_price)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                    >
                      {b.status[0].toUpperCase() + b.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No bookings yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
