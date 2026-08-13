import { SearchIcon } from "./icons";

/**
 * A native GET form — submitting navigates to `/?city=...&check_in=...` etc.
 * No client JS needed: the browser builds the query string, and the home
 * page (a server component) reads it straight from `searchParams`.
 */
export default function SearchBar() {
  return (
    <form
      action="/"
      method="get"
      className="flex w-full max-w-xl items-stretch divide-x divide-neutral-200 rounded-full border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
    >
      <label className="min-w-0 flex-1 px-5 py-2 sm:px-6 sm:py-2.5">
        <span className="block text-[11px] font-semibold text-neutral-900">Where</span>
        <input
          type="text"
          name="city"
          placeholder="Search destinations"
          autoComplete="off"
          className="w-full truncate border-0 bg-transparent p-0 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
        />
      </label>

      <label className="hidden min-w-0 flex-1 px-5 py-2 sm:block sm:px-6 sm:py-2.5">
        <span className="block text-[11px] font-semibold text-neutral-900">Check in</span>
        <input
          type="date"
          name="check_in"
          className="w-full border-0 bg-transparent p-0 text-sm text-neutral-700 focus:outline-none focus:ring-0"
        />
      </label>

      <label className="hidden min-w-0 flex-1 px-5 py-2 sm:block sm:px-6 sm:py-2.5">
        <span className="block text-[11px] font-semibold text-neutral-900">Check out</span>
        <input
          type="date"
          name="check_out"
          className="w-full border-0 bg-transparent p-0 text-sm text-neutral-700 focus:outline-none focus:ring-0"
        />
      </label>

      <div className="flex items-center gap-2 py-1.5 pl-5 pr-1.5 sm:pl-6 sm:pr-2">
        <label className="min-w-0">
          <span className="sr-only">Guests</span>
          <input
            type="number"
            name="guests"
            min={1}
            max={16}
            placeholder="Guests"
            className="w-16 border-0 bg-transparent p-0 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
          />
        </label>
        <button
          type="submit"
          aria-label="Search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
