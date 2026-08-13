import Image from "next/image";
import Link from "next/link";

import type { ListingSummary } from "@/lib/types";

import { StarIcon } from "./icons";
import WishlistHeartButton from "./WishlistHeartButton";

// Real Airbnb's "Guest favourite" badge comes from an internal ranking
// algorithm we don't have — this is a reasonable stand-in threshold, not a
// backend field.
const GUEST_FAVOURITE_MIN_RATING = 4.8;
const GUEST_FAVOURITE_MIN_REVIEWS = 2;

export default function ListingCard({ listing }: { listing: ListingSummary }) {
  const price = Math.round(listing.price_per_night);
  const isGuestFavourite =
    listing.rating != null &&
    listing.rating >= GUEST_FAVOURITE_MIN_RATING &&
    listing.review_count >= GUEST_FAVOURITE_MIN_REVIEWS;

  return (
    <Link href={`/listing/${listing.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
        {listing.cover_photo_url ? (
          <Image
            src={listing.cover_photo_url}
            alt={listing.title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {isGuestFavourite ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 shadow">
            Guest favourite
          </span>
        ) : null}
        <WishlistHeartButton
          listingId={listing.id}
          className="absolute right-2.5 top-2.5 rounded-full p-1 hover:scale-110"
          extraIconClassName="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          inactiveColorClassName="text-white"
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="truncate font-medium text-neutral-900">
          {listing.city}, {listing.country}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-sm text-neutral-900">
          {listing.rating != null ? (
            <>
              <StarIcon className="h-3.5 w-3.5" />
              {listing.rating.toFixed(1)}
            </>
          ) : (
            <span className="font-medium">New</span>
          )}
        </span>
      </div>

      <p className="truncate text-sm text-neutral-500">
        <span className="capitalize">{listing.property_type}</span> · {listing.title}
      </p>

      <p className="mt-1 text-sm text-neutral-900">
        <span className="font-semibold">${price}</span>{" "}
        <span className="text-neutral-500">night</span>
      </p>
    </Link>
  );
}
