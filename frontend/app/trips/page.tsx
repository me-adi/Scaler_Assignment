"use client";

import { isBefore, parseISO, startOfDay } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { getUserTrips } from "@/lib/api";
import type { TripOut } from "@/lib/types";

import TripCard from "@/components/TripCard";

/**
 * "Current user" lives in AuthContext (localStorage-backed, no server
 * session per CLAUDE.md's mocked auth), so this page can't be server-
 * rendered against a known user — it fetches trips client-side once
 * AuthContext resolves, and refetches whenever the switcher changes who's
 * "logged in".
 */
export default function TripsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<TripOut[] | null>(null);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setTrips(null);
      return;
    }

    let cancelled = false;
    setTripsLoading(true);
    setTripsError(false);

    getUserTrips(currentUser.id)
      .then((data) => {
        if (!cancelled) setTrips(data);
      })
      .catch(() => {
        if (!cancelled) setTripsError(true);
      })
      .finally(() => {
        if (!cancelled) setTripsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-8 sm:px-10">
      <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">My Trips</h1>
      {currentUser ? (
        <p className="mt-1 text-sm text-neutral-500">Bookings for {currentUser.name}</p>
      ) : null}

      <div className="mt-8">
        {authLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !currentUser ? (
          <ErrorState message="We couldn't find a current user. Make sure the backend is running." />
        ) : tripsLoading ? (
          <p className="text-sm text-neutral-500">Loading your trips…</p>
        ) : tripsError ? (
          <ErrorState message="We couldn't load your trips right now. Please try again shortly." />
        ) : trips && trips.length > 0 ? (
          <TripsList trips={trips} />
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  );
}

function TripsList({ trips }: { trips: TripOut[] }) {
  const today = startOfDay(new Date());

  const active = trips.filter((t) => t.status !== "cancelled");
  const cancelled = trips.filter((t) => t.status === "cancelled");

  // ISO "YYYY-MM-DD" strings sort correctly lexicographically — no Date
  // parsing needed just to order them.
  const upcoming = active
    .filter((t) => !isBefore(parseISO(t.check_out), today))
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const past = active
    .filter((t) => isBefore(parseISO(t.check_out), today))
    .sort((a, b) => b.check_in.localeCompare(a.check_in));

  return (
    <div className="space-y-12">
      {upcoming.length > 0 ? <TripGroup title="Upcoming trips" trips={upcoming} /> : null}
      {past.length > 0 ? <TripGroup title="Past trips" trips={past} /> : null}
      {cancelled.length > 0 ? <TripGroup title="Cancelled" trips={cancelled} /> : null}
    </div>
  );
}

function TripGroup({ title, trips }: { title: string; trips: TripOut[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="space-y-4">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-neutral-200 py-16 text-center">
      <p className="text-lg font-medium text-neutral-900">No trips booked...yet!</p>
      <p className="mt-1 text-sm text-neutral-500">Time to start planning your next adventure.</p>
      <Link
        href="/"
        className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Start exploring
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 py-16 text-center">
      <p className="text-lg font-medium text-neutral-900">Something went wrong</p>
      <p className="mt-1 text-sm text-neutral-500">{message}</p>
    </div>
  );
}
