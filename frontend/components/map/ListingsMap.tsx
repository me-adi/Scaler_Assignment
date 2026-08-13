"use client";

import dynamic from "next/dynamic";

import type { MapPin } from "./MapInner";

// Leaflet touches `window`/`document` at import time, which crashes during
// Next's server-side render of client components — `ssr: false` is only
// legal from within a client component, hence this wrapper split from the
// actual map implementation.
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500">
      Loading map…
    </div>
  ),
});

export type { MapPin };

export default function ListingsMap({
  pins,
  className,
}: {
  pins: MapPin[];
  className?: string;
}) {
  if (pins.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 text-sm text-neutral-500 ${className ?? "h-full w-full"}`}
      >
        No locations to show on the map.
      </div>
    );
  }

  return <MapInner pins={pins} className={className} />;
}
