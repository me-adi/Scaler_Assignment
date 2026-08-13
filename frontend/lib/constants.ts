/** Property type taxonomy — matches backend/app/seed.py's PROPERTY_TYPES.
 * There's no backend endpoint for this (it's a fixed, small set embedded
 * in `listings.property_type` as free text, not a normalized table like
 * amenities), so both FilterRow and the host listing form share it here. */
export const PROPERTY_TYPES = ["apartment", "house", "cabin", "loft", "villa", "cottage"] as const;
