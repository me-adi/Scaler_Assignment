"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { ApiError, createListing, deleteListing, getAmenities, updateListing } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { AmenityOut, ListingDetail } from "@/lib/types";

import { useToast } from "./Toast";
import { XIcon } from "./icons";

type FormState = {
  title: string;
  description: string;
  propertyType: string;
  city: string;
  country: string;
  pricePerNight: string;
  maxGuests: string;
  bedrooms: string;
  beds: string;
  baths: string;
  photoUrls: string[];
  amenityIds: number[];
};

function toFormState(listing?: ListingDetail): FormState {
  if (!listing) {
    return {
      title: "",
      description: "",
      propertyType: PROPERTY_TYPES[0],
      city: "",
      country: "",
      pricePerNight: "",
      maxGuests: "2",
      bedrooms: "1",
      beds: "1",
      baths: "1",
      photoUrls: [""],
      amenityIds: [],
    };
  }
  return {
    title: listing.title,
    description: listing.description,
    propertyType: listing.property_type,
    city: listing.city,
    country: listing.country,
    pricePerNight: String(listing.price_per_night),
    maxGuests: String(listing.max_guests),
    bedrooms: String(listing.bedrooms),
    beds: String(listing.beds),
    baths: String(listing.baths),
    photoUrls: listing.photos.length > 0 ? listing.photos.map((p) => p.url) : [""],
    amenityIds: listing.amenities.map((a) => a.id),
  };
}

/**
 * Shared by /host/listings/new (no `initialListing`) and
 * /host/listings/[id]/edit (`initialListing` set) — same fields, same
 * validation, so the two pages don't duplicate ~150 lines of form JSX.
 */
export default function ListingForm({ initialListing }: { initialListing?: ListingDetail }) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(() => toFormState(initialListing));
  const [amenities, setAmenities] = useState<AmenityOut[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getAmenities()
      .then(setAmenities)
      .catch(() => {
        // Amenity checkboxes just won't render if this fails — non-fatal.
      });
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(id: number) {
    setForm((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id)
        ? prev.amenityIds.filter((a) => a !== id)
        : [...prev.amenityIds, id],
    }));
  }

  function updatePhotoUrl(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.map((url, i) => (i === index ? value : url)),
    }));
  }

  function addPhotoUrlField() {
    setForm((prev) => ({ ...prev, photoUrls: [...prev.photoUrls, ""] }));
  }

  function removePhotoUrlField(index: number) {
    setForm((prev) => ({ ...prev, photoUrls: prev.photoUrls.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      property_type: form.propertyType,
      city: form.city.trim(),
      country: form.country.trim(),
      price_per_night: Number(form.pricePerNight),
      max_guests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      beds: Number(form.beds),
      baths: Number(form.baths),
      photo_urls: form.photoUrls.map((u) => u.trim()).filter(Boolean),
      amenity_ids: form.amenityIds,
    };

    setSubmitting(true);
    try {
      if (initialListing) {
        await updateListing(initialListing.id, payload);
        showToast("Listing updated.", "success");
      } else {
        await createListing({ host_id: currentUser.id, ...payload });
        showToast("Listing created.", "success");
      }
      router.push("/host/dashboard");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialListing) return;
    if (!window.confirm(`Delete "${initialListing.title}"? This can't be undone.`)) return;

    setDeleting(true);
    try {
      await deleteListing(initialListing.id);
      showToast("Listing deleted.", "success");
      router.push("/host/dashboard");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Couldn't delete this listing.", "error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Property type">
          <select
            value={form.propertyType}
            onChange={(e) => updateField("propertyType", e.target.value)}
            className={inputClass}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              required
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Country">
            <input
              required
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Field label="Price/night">
          <input
            required
            type="number"
            min={1}
            step="0.01"
            value={form.pricePerNight}
            onChange={(e) => updateField("pricePerNight", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Max guests">
          <input
            required
            type="number"
            min={1}
            value={form.maxGuests}
            onChange={(e) => updateField("maxGuests", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Bedrooms">
          <input
            required
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(e) => updateField("bedrooms", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Beds">
          <input
            required
            type="number"
            min={0}
            value={form.beds}
            onChange={(e) => updateField("beds", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Baths">
          <input
            required
            type="number"
            min={0}
            step="0.5"
            value={form.baths}
            onChange={(e) => updateField("baths", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-900">Photo URLs</p>
        <div className="space-y-2">
          {form.photoUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => updatePhotoUrl(i, e.target.value)}
                className={inputClass}
              />
              {form.photoUrls.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removePhotoUrlField(i)}
                  aria-label="Remove photo"
                  className="shrink-0 rounded-lg border border-neutral-200 px-3 text-neutral-500 hover:bg-neutral-50"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPhotoUrlField}
          className="mt-2 text-sm font-medium text-brand hover:underline"
        >
          + Add another photo
        </button>
      </div>

      {amenities.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-900">Amenities</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.amenityIds.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                {a.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : initialListing ? "Save changes" : "Create listing"}
        </button>
        {initialListing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete listing"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-900">{label}</span>
      {children}
    </label>
  );
}
