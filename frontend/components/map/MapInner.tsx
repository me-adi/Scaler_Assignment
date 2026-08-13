"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

export type MapPin = {
  id: number;
  lat: number;
  lng: number;
  price: number;
  href?: string;
};

const DEFAULT_ZOOM = 13;

function priceIcon(price: number): L.DivIcon {
  return L.divIcon({
    html: `<div class="map-price-pill">$${Math.round(price)}</div>`,
    className: "", // avoid Leaflet's default marker-icon class/box entirely
    iconAnchor: [0, 0],
  });
}

/** Fits/centers the view whenever the pin set changes, and fixes Leaflet's
 * classic "sized while its container was display:none" bug — this map gets
 * toggled by both the mobile list/map tab and the desktop split view,
 * neither of which unmounts it, so a ResizeObserver-driven invalidateSize()
 * is more robust than trying to coordinate with every place that could
 * show/hide it. */
function MapController({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  const pinsKey = pins.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");

  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], DEFAULT_ZOOM);
    } else {
      const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsKey]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function MapInner({
  pins,
  className,
}: {
  pins: MapPin[];
  className?: string;
}) {
  const router = useRouter();
  const initialCenter = useRef<[number, number]>(
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [20, 0],
  );

  return (
    <MapContainer
      center={initialCenter.current}
      zoom={pins.length > 0 ? DEFAULT_ZOOM : 2}
      scrollWheelZoom={false}
      className={className ?? "h-full w-full"}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController pins={pins} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={priceIcon(pin.price)}
          eventHandlers={
            pin.href ? { click: () => router.push(pin.href as string) } : undefined
          }
        />
      ))}
    </MapContainer>
  );
}
