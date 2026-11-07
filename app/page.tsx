"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl";

// Price tags only appear once you're zoomed in enough that nearby ones (UCLA/USC) don't overlap.
const PIN_ZOOM = 10;

type Listing = {
  id: string; title: string; address: string; lat: number; lng: number;
  roomType: "PRIVATE" | "SHARED"; totalRoommates: number; beds: number; baths: number;
  totalRent: number; rentShare: number; avgUtilities: number;
  petsAllowed: boolean; halalKitchen: boolean; genderPref: "BROTHERS" | "SISTERS" | "ANY";
  description?: string; contactEmail: string;
};

const TOKEN = process.env.NEXT_MAPBOX_TOKEN;

const HOUSE = {
  BROTHERS: { label: "Brothers' house", cls: "bg-brothers text-white" },
  SISTERS: { label: "Sisters' house", cls: "bg-sisters text-white" },
  ANY: { label: "Mixed, separate floors", cls: "bg-paper text-ink ring-1 ring-ink/15" },
};

const usd = (n: number) => `$${n.toLocaleString()}`;

// Eight-point star (Rub el Hizb), the Manara mark.
function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1l2.6 4.4L19.8 4.2 18.6 9.4 23 12l-4.4 2.6 1.2 5.2-5.2-1.2L12 23l-2.6-4.4-5.2 1.2 1.2-5.2L1 12l4.4-2.6L4.2 4.2l5.2 1.2z" />
    </svg>
  );
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showPrices, setShowPrices] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Listing[]) => { setListings(d); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    if (selected) headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <main className="relative h-dvh w-screen overflow-clip bg-paper">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-[0_8px_24px_rgba(20,33,61,0.35)]">
          <Star className="h-6 w-6 text-lantern" />
          <div>
            <p className="font-display text-xl font-bold leading-none tracking-wide">Manara</p>
            <p className="mt-1 text-xs text-white/70">
              {status === "loading" && "Finding rooms…"}
              {status === "error" && "Couldn't load rooms. Refresh to try again."}
              {status === "ready" && (showPrices
                ? `${listings.length} rooms from verified .edu students`
                : "Zoom in or tap a dot to see prices")}
            </p>
          </div>
        </div>
      </header>

      {!TOKEN ? (
        <div className="grid h-full place-items-center p-6 text-center">
          <p className="max-w-sm text-ink/80">
            The map needs a Mapbox token. Add <code className="rounded bg-white px-1">NEXT_MAPBOX_TOKEN</code> to
            <code className="rounded bg-white px-1"> .env</code> and restart the dev server.
          </p>
        </div>
      ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          onZoom={(e) => setShowPrices(e.viewState.zoom >= PIN_ZOOM)}
          initialViewState={{ longitude: -120.5, latitude: 36.0, zoom: 5.3 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onClick={() => setSelected(null)}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          {!showPrices && listings.map((l) => (
            <Marker
              key={l.id}
              longitude={l.lng}
              latitude={l.lat}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: PIN_ZOOM + 0.5 });
              }}
            >
              <button
                aria-label={`Zoom in to see rooms near ${l.address}`}
                className="grid h-11 w-11 place-items-center outline-none focus-visible:ring-4 focus-visible:ring-ink/40 rounded-full"
              >
                <span className="h-3.5 w-3.5 rounded-full bg-lantern ring-2 ring-ink shadow" />
              </button>
            </Marker>
          ))}
          {showPrices && listings.map((l) => {
            const active = selected?.id === l.id;
            return (
              <Marker
                key={l.id}
                longitude={l.lng}
                latitude={l.lat}
                anchor="bottom"
                style={{ zIndex: active ? 2 : 1 }}
                onClick={(e) => { e.originalEvent.stopPropagation(); setSelected(l); }}
              >
                <button
                  aria-label={`${l.title}, ${usd(l.rentShare)} a month`}
                  aria-pressed={active}
                  className={`group relative flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 font-display text-[15px] font-bold shadow-[0_4px_12px_rgba(20,33,61,0.3)] outline-none focus-visible:ring-4 focus-visible:ring-ink/40 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${
                    active ? "bg-ink text-lantern" : "bg-lantern text-ink"
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  {usd(l.rentShare)}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 ${active ? "bg-ink" : "bg-lantern"}`}
                  />
                </button>
              </Marker>
            );
          })}
        </Map>
      )}

      <aside
        aria-label="Room details"
        aria-hidden={!selected}
        className={`absolute inset-y-0 right-0 z-20 w-full overflow-y-auto overscroll-contain bg-white shadow-[-12px_0_40px_rgba(20,33,61,0.18)] sm:w-[420px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${
          selected ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {selected && (
          <div className="flex min-h-full flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white/95 px-5 py-3 backdrop-blur">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${HOUSE[selected.genderPref].cls}`}>
                {HOUSE[selected.genderPref].label}
              </span>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close room details"
                className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-5 pb-6">
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold leading-tight outline-none">
                {selected.title}
              </h2>
              <p className="mt-1 text-ink/65">{selected.address}</p>

              <section className="mt-5 rounded-2xl bg-ink p-5 text-white">
                <p className="text-sm text-white/70">Your share each month</p>
                <p className="font-display text-4xl font-bold text-lantern">{usd(selected.rentShare)}</p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <Row label="Utilities (avg.)" value={`+ ${usd(selected.avgUtilities)}`} />
                  <Row label="You'd pay about" value={usd(selected.rentShare + selected.avgUtilities)} strong />
                  <Row label="Whole apartment" value={usd(selected.totalRent)} muted />
                </dl>
              </section>

              <h3 className="mt-7 font-semibold">The space</h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Room" value={selected.roomType === "PRIVATE" ? "Private room" : "Shared room"} />
                <Fact label="Roommates" value={`${selected.totalRoommates} total`} />
                <Fact label="Bedrooms" value={selected.beds} />
                <Fact label="Bathrooms" value={selected.baths} />
              </dl>

              <h3 className="mt-7 font-semibold">House rules</h3>
              <ul className="mt-3 space-y-2">
                <Rule ok={selected.halalKitchen} yes="Halal kitchen" no="Kitchen isn't halal-only" />
                <Rule ok={selected.petsAllowed} yes="Pets welcome" no="No pets" />
              </ul>

              {selected.description && (
                <p className="mt-7 max-w-prose leading-relaxed text-ink/80">{selected.description}</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
              <a
                href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent("Manara: " + selected.title)}`}
                className="block min-h-[48px] rounded-xl bg-ink py-3 text-center font-semibold text-white hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Email the lister
              </a>
              <p className="mt-2 text-center text-xs text-ink/60">{selected.contactEmail}</p>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-white/60" : ""} ${strong ? "border-t border-white/15 pt-1.5 font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-sm text-ink/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Rule({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-sage/15 text-sage" : "bg-clay/10 text-clay"}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d={ok ? "M5 12.5l4.5 4.5L19 7.5" : "M7 7l10 10M17 7L7 17"}
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
        </svg>
      </span>
      <span>{ok ? yes : no}</span>
    </li>
  );
}
