"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Establishment } from "@/lib/types";

// ── react-leaflet pieces, dynamically loaded so SSR doesn't choke on `window`.
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);

// ── Geocode {district, province} → [lat, lng] via Nominatim, cached in localStorage.
async function geocodeOne(
  district: string,
  province: string,
): Promise<[number, number] | null> {
  if (typeof window === "undefined") return null;
  const cacheKey = `sb_geo:${province}:${district}`.toLowerCase();
  const cached = window.localStorage.getItem(cacheKey);
  if (cached) {
    if (cached === "null") return null;
    try {
      const parsed = JSON.parse(cached) as [number, number] | null;
      if (parsed && Array.isArray(parsed) && parsed.length === 2) return parsed;
    } catch {
      /* ignore */
    }
  }
  const q = encodeURIComponent(`${district}, ${province}, Argentina`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=ar`;
  try {
    const resp = await fetch(url, { headers: { "Accept-Language": "es" } });
    if (!resp.ok) return null;
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (data && data.length > 0) {
      const result: [number, number] = [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon),
      ];
      window.localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
    // cache the negative so we don't keep retrying every render
    window.localStorage.setItem(cacheKey, "null");
    return null;
  } catch {
    return null;
  }
}

// ── Custom marker icon (lazy-built; needs Leaflet at runtime).
async function buildIcon() {
  const L = (await import("leaflet")).default;
  return L.divIcon({
    className: "sb-pin",
    html: `
      <div class="sb-pin-inner">
        <svg viewBox="0 0 24 24" fill="#4d7c2a" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
          <path d="M12 2c-4.4 0-8 3.5-8 7.8 0 5.5 7 11.4 7.4 11.7a1 1 0 0 0 1.2 0c.4-.3 7.4-6.2 7.4-11.7C20 5.5 16.4 2 12 2Z"/>
          <circle cx="12" cy="10" r="2.6" fill="#ffffff" stroke="none"/>
        </svg>
      </div>
    `,
    iconSize: [28, 32],
    iconAnchor: [14, 30],
    popupAnchor: [0, -28],
  });
}

interface Pin {
  est: Establishment;
  pos: [number, number];
}

interface MapInnerProps {
  pins: Pin[];
  icon: L.DivIcon;
}

function MapInner({ pins, icon }: MapInnerProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // Auto-fit bounds whenever we have pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pins.length === 0) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const bounds = L.latLngBounds(pins.map((p) => p.pos));
      map.fitBounds(bounds.pad(0.25), { animate: false, maxZoom: 9 });
    })();
  }, [pins]);

  const center: LatLngExpression = useMemo(() => {
    const lat = pins.reduce((s, p) => s + p.pos[0], 0) / pins.length;
    const lng = pins.reduce((s, p) => s + p.pos[1], 0) / pins.length;
    return [lat, lng];
  }, [pins]);

  return (
    <MapContainer
      ref={(m) => {
        mapRef.current = m as LeafletMap | null;
      }}
      center={center}
      zoom={5}
      scrollWheelZoom={true}
      zoomControl={false}
      style={{ height: "100%", width: "100%", background: "var(--surface-2)" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />
      {pins.map((p) => (
        <Marker key={p.est.id} position={p.pos} icon={icon}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{p.est.name}</div>
              <div className="text-text-muted text-xs">
                {p.est.district}, {p.est.province}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

interface Props {
  establishments: Establishment[];
}

export function EstablishmentsMap({ establishments }: Props) {
  const eligible = useMemo(
    () => establishments.filter((e) => e.district && e.province),
    [establishments],
  );

  const [pins, setPins] = useState<Pin[]>([]);
  const [icon, setIcon] = useState<L.DivIcon | null>(null);

  // Build icon once.
  useEffect(() => {
    let cancelled = false;
    buildIcon().then((i) => {
      if (!cancelled) setIcon(i);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Geocode each eligible establishment, one at a time.
  useEffect(() => {
    if (eligible.length === 0) {
      setPins([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const out: Pin[] = [];
      for (const est of eligible) {
        if (cancelled) return;
        const pos = await geocodeOne(est.district!, est.province!);
        if (cancelled) return;
        if (pos) {
          out.push({ est, pos });
          // Update incrementally so the map can show the first pin while others geocode.
          if (!cancelled) setPins([...out]);
        }
        const wasCached = window.localStorage.getItem(
          `sb_geo:${est.province}:${est.district}`.toLowerCase(),
        );
        if (!wasCached) await new Promise((r) => setTimeout(r, 1100));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eligible]);

  // Hide the map entirely when we have no eligible campos OR no resolved pins yet.
  if (eligible.length === 0 || pins.length === 0 || !icon) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-surface-2 h-56 sm:h-64 mb-6 sb-map-shell">
      <MapInner pins={pins} icon={icon} />
    </div>
  );
}
