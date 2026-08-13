import Link from "next/link";

import { PROPERTY_TYPES } from "@/lib/constants";
import { buildSearchHref } from "@/lib/url";

export default function FilterRow({
  active,
  searchParams,
}: {
  active?: string;
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <nav
      aria-label="Filter by property type"
      className="scrollbar-hide flex gap-3 overflow-x-auto border-b border-neutral-200 px-6 py-4 sm:px-10"
    >
      <Link
        href={buildSearchHref(searchParams, { property_type: null, page: null })}
        className={pillClasses(!active)}
      >
        All
      </Link>
      {PROPERTY_TYPES.map((type) => (
        <Link
          key={type}
          href={buildSearchHref(searchParams, {
            property_type: active === type ? null : type,
            page: null,
          })}
          className={pillClasses(active === type)}
        >
          {type[0].toUpperCase() + type.slice(1)}
        </Link>
      ))}
    </nav>
  );
}

function pillClasses(isActive: boolean) {
  return [
    "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    isActive
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-200 text-neutral-700 hover:border-neutral-900",
  ].join(" ");
}
