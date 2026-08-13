/**
 * Query-string helper shared by FilterRow and Pagination, which both need to
 * change one param (property_type, page) while preserving the rest.
 */

export function buildSearchHref(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
