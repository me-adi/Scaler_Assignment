import Link from "next/link";

import { HeartIcon, SuitcaseIcon } from "./icons";
import SearchBar from "./SearchBar";
import UserSwitcher from "./UserSwitcher";

/**
 * Global chrome, rendered from app/layout.tsx so it's shared across every
 * page. Layouts don't receive `searchParams` in the App Router, so the
 * search pill here always starts blank — it's for launching a new search,
 * not mirroring the current page's filters (FilterRow/Pagination handle
 * that, since page.tsx does have searchParams).
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      {/* The search bar renders twice (here, hidden on mobile, and again
          below toggled the other way) rather than sharing one row with the
          user switcher — each layout gets the full row width to itself. */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-brand sm:text-xl">
          airbnbclone
        </Link>

        <div className="hidden sm:flex sm:flex-1 sm:justify-center">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:px-3"
          >
            <HeartIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Wishlist</span>
          </Link>
          <Link
            href="/trips"
            aria-label="My Trips"
            className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:px-3"
          >
            <SuitcaseIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Trips</span>
          </Link>
          <UserSwitcher />
          <Link
            href="/host/dashboard"
            className="rounded-full px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:px-3"
          >
            <span className="sm:hidden">Host</span>
            <span className="hidden sm:inline">Become a host</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-neutral-100 px-6 py-2 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
