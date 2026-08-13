"use client";

import { useAuth } from "@/context/AuthContext";

import ListingForm from "@/components/ListingForm";

export default function NewListingPage() {
  const { currentUser, loading: authLoading } = useAuth();

  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-8 sm:px-10">
      <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">Create a new listing</h1>

      <div className="mt-8">
        {authLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !currentUser ? (
          <p className="text-sm text-neutral-500">
            We couldn&apos;t find a current user. Make sure the backend is running.
          </p>
        ) : currentUser.role !== "host" ? (
          <p className="text-sm text-neutral-500">
            Switch to a host account (top right) to create a listing.
          </p>
        ) : (
          <ListingForm />
        )}
      </div>
    </main>
  );
}
