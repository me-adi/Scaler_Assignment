"use client";

import { useWishlist } from "@/context/WishlistContext";

import { HeartIcon } from "./icons";

/**
 * Used both as a photo overlay on ListingCard and plain (near a title) on
 * the listing detail page. `extraIconClassName` and `inactiveColorClassName`
 * are kept separate (rather than one combined className prop) so the
 * active-state color swap is always a single mutually-exclusive class —
 * combining two color utilities in one class list leaves the winner up to
 * Tailwind's compiled rule order, not JSX order (bit us once already, in
 * DateRangePicker's range-highlight styling).
 */
export default function WishlistHeartButton({
  listingId,
  className,
  extraIconClassName = "",
  inactiveColorClassName = "text-neutral-700",
}: {
  listingId: number;
  className?: string;
  extraIconClassName?: string;
  inactiveColorClassName?: string;
}) {
  const { isWishlisted, toggleWishlist, pendingIds } = useWishlist();
  const active = isWishlisted(listingId);
  const pending = pendingIds.has(listingId);
  const colorClass = active ? "text-brand" : inactiveColorClassName;

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      disabled={pending}
      onClick={(e) => {
        // Cards wrap this in a <Link> — stop the click from also navigating.
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(listingId);
      }}
      className={`flex items-center justify-center transition-transform active:scale-90 disabled:opacity-60 ${className ?? ""}`}
    >
      <HeartIcon className={`h-6 w-6 ${extraIconClassName} ${colorClass}`} filled={active} />
    </button>
  );
}
