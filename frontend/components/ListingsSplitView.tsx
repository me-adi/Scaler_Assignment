"use client";

import { useState } from "react";

import type { ListingSummary } from "@/lib/types";

import ListingCard from "./ListingCard";
import Pagination from "./Pagination";
import ListingsMap, { type MapPin } from "./map/ListingsMap";

type ViewMode = "list" | "map";

/**
 * The search-results list+map split view — desktop shows both side by side,
 * mobile shows one at a time via a tab switcher. Takes the already-fetched
 * `items` as a prop rather than fetching anything itself: the map is just
 * another view of the same filtered listings the grid already has, not a
 * separate data source.
 */
export default function ListingsSplitView({
  items,
  page,
  totalPages,
  searchParams,
}: {
  items: ListingSummary[];
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  const [view, setView] = useState<ViewMode>("list");

  const pins: MapPin[] = items
    .filter((listing) => listing.latitude != null && listing.longitude != null)
    .map((listing) => ({
      id: listing.id,
      lat: listing.latitude as number,
      lng: listing.longitude as number,
      price: listing.price_per_night,
      href: `/listing/${listing.id}`,
    }));

  return (
    <div>
      <div className="mb-4 flex gap-2 lg:hidden">
        <button type="button" onClick={() => setView("list")} className={tabClass(view === "list")}>
          List
        </button>
        <button type="button" onClick={() => setView("map")} className={tabClass(view === "map")}>
          Map
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className={view === "map" ? "hidden lg:block" : "block"}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
        </div>

        <div
          className={`${view === "list" ? "hidden lg:block" : "block"} h-[70vh] overflow-hidden rounded-2xl lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]`}
        >
          <ListingsMap pins={pins} />
        </div>
      </div>
    </div>
  );
}

function tabClass(active: boolean) {
  return [
    "flex-1 rounded-full border px-4 py-2 text-center text-sm font-medium transition-colors",
    active
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 text-neutral-700 hover:border-neutral-900",
  ].join(" ");
}
