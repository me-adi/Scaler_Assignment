import { ApiError, searchListings } from "@/lib/api";
import type { ListingSearchParams, ListingSummary } from "@/lib/types";

import FilterRow from "@/components/FilterRow";
import ListingCard from "@/components/ListingCard";
import ListingRow from "@/components/ListingRow";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 24;
// No filters active → the curated "rows by city" browse view instead of a
// flat grid, so it fetches a larger unpaginated batch to group client-side.
const BROWSE_FETCH_SIZE = 50;

const ROW_TITLE_TEMPLATES: Array<(city: string) => string> = [
  (city) => `Check out homes in ${city}`,
  (city) => `Popular homes in ${city}`,
  (city) => `Explore stays in ${city}`,
];

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toPositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Preserves first-seen order rather than sorting alphabetically, so row
 * order matches the underlying listing order (newest-created first). */
function groupByCity(listings: ListingSummary[]): [string, ListingSummary[]][] {
  const map = new Map<string, ListingSummary[]>();
  for (const listing of listings) {
    const existing = map.get(listing.city);
    if (existing) existing.push(listing);
    else map.set(listing.city, [listing]);
  }
  return [...map.entries()];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;

  const city = first(sp.city) || undefined;
  const propertyType = first(sp.property_type) || undefined;
  const guests = toPositiveInt(first(sp.guests));
  const page = toPositiveInt(first(sp.page)) ?? 1;

  // An unpaired or inverted date range means "no date filter" rather than a
  // 422 bubbling up from the backend — check_in/check_out are independent
  // native <input type="date"> fields, so a half-filled pair is expected.
  let checkIn = first(sp.check_in) || undefined;
  let checkOut = first(sp.check_out) || undefined;
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    checkIn = undefined;
    checkOut = undefined;
  }

  const hasActiveFilters = Boolean(city || propertyType || guests || (checkIn && checkOut));
  const isBrowseView = !hasActiveFilters && page === 1;

  const params: ListingSearchParams = isBrowseView
    ? { page: 1, page_size: BROWSE_FETCH_SIZE }
    : {
        city,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        property_type: propertyType,
        page,
        page_size: PAGE_SIZE,
      };

  let result;
  let loadError = false;
  try {
    result = await searchListings(params);
  } catch (err) {
    loadError = true;
    result = { items: [], total: 0, page: 1, page_size: PAGE_SIZE, total_pages: 0 };
    console.error("Failed to load listings:", err instanceof ApiError ? err.message : err);
  }

  const currentParams: Record<string, string | undefined> = {
    city,
    check_in: checkIn,
    check_out: checkOut,
    guests: guests?.toString(),
    property_type: propertyType,
  };

  return (
    <main>
      <FilterRow active={propertyType} searchParams={currentParams} />

      <section className="px-6 pb-16 pt-4 sm:px-10">
        {loadError ? (
          <div className="py-24 text-center">
            <p className="text-lg font-medium text-neutral-900">
              We couldn&apos;t load listings right now.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Make sure the backend is running, then refresh.
            </p>
          </div>
        ) : result.items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-medium text-neutral-900">No stays match your search.</p>
            <p className="mt-1 text-sm text-neutral-500">
              Try a different destination or clear a filter.
            </p>
          </div>
        ) : isBrowseView ? (
          <div className="divide-y divide-neutral-100">
            {groupByCity(result.items).map(([cityName, listings], i) => (
              <ListingRow
                key={cityName}
                title={ROW_TITLE_TEMPLATES[i % ROW_TITLE_TEMPLATES.length](cityName)}
                seeAllHref={`/?city=${encodeURIComponent(cityName)}`}
                listings={listings}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {result.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.total_pages}
              searchParams={currentParams}
            />
          </>
        )}
      </section>
    </main>
  );
}
