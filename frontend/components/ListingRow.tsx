"use client";

import Link from "next/link";
import { useRef } from "react";

import type { ListingSummary } from "@/lib/types";

import ListingCard from "./ListingCard";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** A horizontally-scrollable row of listings with prev/next arrow buttons,
 * e.g. "Check out homes in Kyoto". `seeAllHref` reuses the existing search —
 * it's just a link to `/?city=...`, not a separate feature. */
export default function ListingRow({
  title,
  seeAllHref,
  listings,
}: {
  title: string;
  seeAllHref?: string;
  listings: ListingSummary[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="group flex min-w-0 items-center gap-1 text-lg font-semibold text-neutral-900 sm:text-xl"
          >
            <span className="truncate">{title}</span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <h2 className="truncate text-lg font-semibold text-neutral-900 sm:text-xl">{title}</h2>
        )}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:shadow-md"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:shadow-md"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {listings.map((listing) => (
          <div key={listing.id} className="w-[46vw] shrink-0 sm:w-[220px] lg:w-[240px]">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
