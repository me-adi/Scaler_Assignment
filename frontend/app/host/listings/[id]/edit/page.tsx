"use client";

import { use, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, getListing } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";

import ListingForm from "@/components/ListingForm";

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const listingId = Number.parseInt(id, 10);
  const { currentUser, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(listingId) || listingId <= 0) {
      setNotFound(true);
      setLoadingListing(false);
      return;
    }

    let cancelled = false;
    getListing(listingId)
      .then((data) => {
        if (!cancelled) setListing(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingListing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const loading = authLoading || loadingListing;
  const notOwner = listing != null && currentUser != null && listing.host_id !== currentUser.id;

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-8 sm:px-10">
      <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">Edit listing</h1>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !currentUser ? (
          <p className="text-sm text-neutral-500">
            We couldn&apos;t find a current user. Make sure the backend is running.
          </p>
        ) : notFound ? (
          <p className="text-sm text-neutral-500">Listing not found.</p>
        ) : loadError || !listing ? (
          <p className="text-sm text-neutral-500">
            We couldn&apos;t load this listing right now. Please try again shortly.
          </p>
        ) : notOwner ? (
          <p className="text-sm text-neutral-500">
            You don&apos;t manage this listing. Switch to its host (top right) to edit it.
          </p>
        ) : (
          <ListingForm initialListing={listing} />
        )}
      </div>
    </main>
  );
}
