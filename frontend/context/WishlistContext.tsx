"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, addToWishlist, getUserWishlist, removeFromWishlist } from "@/lib/api";
import type { WishlistItemOut } from "@/lib/types";

import { useToast } from "@/components/Toast";

type WishlistContextValue = {
  items: WishlistItemOut[];
  loading: boolean;
  isWishlisted: (listingId: number) => boolean;
  toggleWishlist: (listingId: number) => Promise<void>;
  pendingIds: Set<number>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Holds the current user's full wishlist (not just ids) so both the heart
 * icons scattered across cards and the wishlist page itself share one fetch
 * instead of each re-querying GET /users/{id}/wishlist independently.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<WishlistItemOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getUserWishlist(currentUser.id)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        // Heart icons just show "not saved" until the next successful fetch.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const isWishlisted = useCallback(
    (listingId: number) => items.some((item) => item.listing_id === listingId),
    [items],
  );

  const toggleWishlist = useCallback(
    async (listingId: number) => {
      if (!currentUser) {
        showToast("Select a user (top right) to save listings.", "info");
        return;
      }

      setPendingIds((prev) => new Set(prev).add(listingId));
      const alreadyIn = items.some((item) => item.listing_id === listingId);

      try {
        if (alreadyIn) {
          await removeFromWishlist(listingId, currentUser.id);
          setItems((prev) => prev.filter((item) => item.listing_id !== listingId));
          showToast("Removed from wishlist.", "success");
        } else {
          const created = await addToWishlist({ user_id: currentUser.id, listing_id: listingId });
          setItems((prev) => [...prev, created]);
          showToast("Saved to wishlist.", "success");
        }
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Couldn't update your wishlist.", "error");
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [currentUser, items, showToast],
  );

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggleWishlist, pendingIds }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
