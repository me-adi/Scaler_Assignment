"use client";

import { format } from "date-fns";
import Image from "next/image";
import { useEffect } from "react";

import { XIcon } from "./icons";

/**
 * The "mocked checkout" step — a confirmation summary in place of a real
 * payment form, since payments are mocked per CLAUDE.md.
 */
export default function BookingConfirmModal({
  open,
  onClose,
  onConfirm,
  submitting,
  listingTitle,
  coverPhotoUrl,
  checkIn,
  checkOut,
  nights,
  guests,
  nightlyRate,
  subtotal,
  guestName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  listingTitle: string;
  coverPhotoUrl: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  nightlyRate: number;
  subtotal: number;
  guestName: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="booking-confirm-title" className="text-lg font-semibold text-neutral-900">
            Confirm and book
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 border-b border-neutral-200 pb-4">
          {coverPhotoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              <Image src={coverPhotoUrl} alt={listingTitle} fill sizes="64px" className="object-cover" />
            </div>
          ) : null}
          <p className="text-sm font-medium text-neutral-900">{listingTitle}</p>
        </div>

        <dl className="mt-4 space-y-2 border-b border-neutral-200 pb-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Dates</dt>
            <dd className="text-neutral-900">
              {format(checkIn, "MMM d")} – {format(checkOut, "MMM d, yyyy")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Guests</dt>
            <dd className="text-neutral-900">{guests}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Booking as</dt>
            <dd className="text-neutral-900">{guestName}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-700">
            <span>
              ${nightlyRate} × {nights} night{nights === 1 ? "" : "s"}
            </span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
            <span>Total</span>
            <span>${subtotal}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          This is a mocked checkout — no real payment is processed.
        </p>

        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="mt-4 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Confirming…" : "Confirm and book"}
        </button>
      </div>
    </div>
  );
}
