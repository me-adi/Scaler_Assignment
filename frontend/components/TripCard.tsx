import { format, parseISO } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import type { TripOut } from "@/lib/types";

const STATUS_STYLES: Record<TripOut["status"], string> = {
  confirmed: "bg-neutral-900 text-white",
  completed: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<TripOut["status"], string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TripCard({ trip }: { trip: TripOut }) {
  const checkIn = parseISO(trip.check_in);
  const checkOut = parseISO(trip.check_out);

  return (
    <Link
      href={`/listing/${trip.listing.id}`}
      className="flex gap-4 rounded-xl border border-neutral-200 p-4 transition-shadow hover:shadow-md"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-32 sm:w-32">
        {trip.listing.cover_photo_url ? (
          <Image
            src={trip.listing.cover_photo_url}
            alt={trip.listing.title}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{trip.listing.title}</p>
            <p className="text-sm text-neutral-500">
              {trip.listing.city}, {trip.listing.country}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[trip.status]}`}
          >
            {STATUS_LABELS[trip.status]}
          </span>
        </div>

        <p className="mt-2 text-sm text-neutral-700">
          {format(checkIn, "MMM d")} – {format(checkOut, "MMM d, yyyy")} · {trip.guests} guest
          {trip.guests === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm font-medium text-neutral-900">
          ${Math.round(trip.total_price)} total
        </p>
      </div>
    </Link>
  );
}
