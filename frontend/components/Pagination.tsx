import Link from "next/link";
import type { ReactNode } from "react";

import { buildSearchHref } from "@/lib/url";

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export default function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <PageLink
        disabled={page <= 1}
        href={buildSearchHref(searchParams, { page: page - 1 })}
        ariaLabel="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </PageLink>

      {pageNumbers.map((n, i) =>
        n === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={buildSearchHref(searchParams, { page: n })}
            aria-current={n === page ? "page" : undefined}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
              n === page ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100",
            ].join(" ")}
          >
            {n}
          </Link>
        ),
      )}

      <PageLink
        disabled={page >= totalPages}
        href={buildSearchHref(searchParams, { page: page + 1 })}
        ariaLabel="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  disabled,
  href,
  ariaLabel,
  children,
}: {
  disabled: boolean;
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const className =
    "flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={ariaLabel}
        className={`${className} pointer-events-none text-neutral-300`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}

/** Prev … current-1 current current+1 … Next, collapsing runs into an ellipsis. */
function getPageWindow(current: number, total: number): (number | "…")[] {
  const windowSize = 1;
  const pages = new Set<number>([1, total, current]);
  for (let i = 1; i <= windowSize; i++) {
    if (current - i >= 1) pages.add(current - i);
    if (current + i <= total) pages.add(current + i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}
