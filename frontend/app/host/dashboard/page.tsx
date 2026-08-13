"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, deleteListing, searchListings } from "@/lib/api";
import type { ListingSummary } from "@/lib/types";

import HostListingRow from "@/components/HostListingRow";
import { useToast } from "@/components/Toast";

/**
 * "Current user" lives in AuthContext (client-only, per CLAUDE.md's mocked
 * auth), so this can't be server-rendered against a known host — it fetches
 * once AuthContext resolves and refetches whenever the switcher changes who
 * "logged in" (so switching away from a host and back stays correct).
 */
export default function HostDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState<ListingSummary[] | null>(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "host") {
      setListings(null);
      return;
    }

    let cancelled = false;
    setListingsLoading(true);
    setListingsError(false);

    searchListings({ host_id: currentUser.id, page_size: 50 })
      .then((res) => {
        if (!cancelled) setListings(res.items);
      })
      .catch(() => {
        if (!cancelled) setListingsError(true);
      })
      .finally(() => {
        if (!cancelled) setListingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  async function handleDelete(listing: ListingSummary) {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;

    try {
      await deleteListing(listing.id);
      setListings((prev) => prev?.filter((l) => l.id !== listing.id) ?? null);
      showToast("Listing deleted.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't delete this listing.", "error");
    }
  }

  const isHost = currentUser?.role === "host";

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-8 sm:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">Host dashboard</h1>
        {isHost ? (
          <Link
            href="/host/listings/new"
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + New listing
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        {authLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !currentUser ? (
          <EmptyPanel message="We couldn't find a current user. Make sure the backend is running." />
        ) : !isHost ? (
          <EmptyPanel message="Switch to a host account (top right) to manage listings." />
        ) : listingsLoading ? (
          <p className="text-sm text-neutral-500">Loading your listings…</p>
        ) : listingsError ? (
          <EmptyPanel message="We couldn't load your listings right now. Please try again shortly." />
        ) : listings && listings.length > 0 ? (
          <div className="space-y-4">
            {listings.map((listing) => (
              <HostListingRow
                key={listing.id}
                listing={listing}
                onDelete={() => handleDelete(listing)}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel message="You don't have any listings yet." action />
        )}
      </div>
    </main>
  );
}

function EmptyPanel({ message, action }: { message: string; action?: boolean }) {
  return (
    <div className="rounded-xl border border-neutral-200 py-16 text-center">
      <p className="text-sm text-neutral-500">{message}</p>
      {action ? (
        <Link
          href="/host/listings/new"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Create your first listing
        </Link>
      ) : null}
    </div>
  );
}
