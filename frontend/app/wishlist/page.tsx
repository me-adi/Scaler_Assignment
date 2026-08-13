"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

import ListingCard from "@/components/ListingCard";

/**
 * "Current user" lives in AuthContext (client-only, per CLAUDE.md's mocked
 * auth), so this is a client page — but unlike Trips, it doesn't need its
 * own fetch: WishlistContext already holds the current user's full wishlist
 * (with nested listing summaries), shared with every heart icon on screen.
 */
export default function WishlistPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { items, loading: wishlistLoading } = useWishlist();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 sm:px-10">
      <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">Wishlist</h1>
      {currentUser ? (
        <p className="mt-1 text-sm text-neutral-500">Saved listings for {currentUser.name}</p>
      ) : null}

      <div className="mt-8">
        {authLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !currentUser ? (
          <EmptyPanel message="We couldn't find a current user. Make sure the backend is running." />
        ) : wishlistLoading ? (
          <p className="text-sm text-neutral-500">Loading your wishlist…</p>
        ) : items.length === 0 ? (
          <EmptyPanel message="No saved listings yet." action />
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ListingCard key={item.listing_id} listing={item.listing} />
            ))}
          </div>
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
          href="/"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Start exploring
        </Link>
      ) : null}
    </div>
  );
}
