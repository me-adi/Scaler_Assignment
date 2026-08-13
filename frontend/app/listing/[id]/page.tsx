import Image from "next/image";
import { notFound } from "next/navigation";

import { ApiError, getListing, getListingBookings, getListingReviews } from "@/lib/api";

import BookingSummary from "@/components/BookingSummary";
import Gallery from "@/components/Gallery";
import ReviewsSection from "@/components/ReviewsSection";
import WishlistHeartButton from "@/components/WishlistHeartButton";
import { StarIcon } from "@/components/icons";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingId = Number.parseInt(id, 10);
  if (!Number.isFinite(listingId) || listingId <= 0) {
    notFound();
  }

  let listing;
  try {
    listing = await getListing(listingId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-10">
        <p className="text-lg font-medium text-neutral-900">
          We couldn&apos;t load this listing right now.
        </p>
        <p className="mt-1 text-sm text-neutral-500">Please try again shortly.</p>
      </main>
    );
  }

  // Bookings/reviews failing shouldn't take down a listing whose core data
  // loaded fine — degrade to empty lists instead.
  const [bookedRangesResult, reviewsResult] = await Promise.allSettled([
    getListingBookings(listingId),
    getListingReviews(listingId),
  ]);
  const bookedRanges = bookedRangesResult.status === "fulfilled" ? bookedRangesResult.value : [];
  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-6 sm:px-10">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">{listing.title}</h1>
        <WishlistHeartButton
          listingId={listing.id}
          className="shrink-0 rounded-full border border-neutral-200 p-2 hover:bg-neutral-50"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-700">
        {listing.rating != null ? (
          <span className="flex items-center gap-1 font-medium text-neutral-900">
            <StarIcon className="h-3.5 w-3.5" />
            {listing.rating.toFixed(1)}
          </span>
        ) : (
          <span className="font-medium text-neutral-900">New</span>
        )}
        {listing.review_count > 0 ? (
          <>
            <span>·</span>
            <span className="underline">
              {listing.review_count} review{listing.review_count === 1 ? "" : "s"}
            </span>
          </>
        ) : null}
        <span>·</span>
        <span>
          {listing.city}, {listing.country}
        </span>
      </div>

      <div className="mt-6">
        <Gallery photos={listing.photos} title={listing.title} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
            <div>
              <p className="text-lg font-semibold text-neutral-900">Hosted by {listing.host.name}</p>
              <p className="text-sm text-neutral-500">
                {listing.max_guests} guests · {listing.bedrooms} bedroom
                {listing.bedrooms === 1 ? "" : "s"} · {listing.beds} bed{listing.beds === 1 ? "" : "s"} ·{" "}
                {listing.baths} bath{listing.baths === 1 ? "" : "s"}
              </p>
              {listing.host.is_superhost ? (
                <p className="mt-1 text-sm font-medium text-neutral-900">★ Superhost</p>
              ) : null}
            </div>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-200">
              {listing.host.avatar_url ? (
                <Image
                  src={listing.host.avatar_url}
                  alt={listing.host.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
          </div>

          <div className="border-b border-neutral-200 py-6">
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">About this place</h2>
            <p className="whitespace-pre-line text-neutral-700">{listing.description}</p>
          </div>

          {listing.amenities.length > 0 ? (
            <div className="py-6">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900">What this place offers</h2>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {listing.amenities.map((amenity) => (
                  <li key={amenity.id} className="flex items-center gap-3 text-neutral-700">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                    {amenity.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <BookingSummary listing={listing} bookedRanges={bookedRanges} />
          </div>
        </div>
      </div>

      <ReviewsSection reviews={reviews} rating={listing.rating} reviewCount={listing.review_count} />
    </main>
  );
}
