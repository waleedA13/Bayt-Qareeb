"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl";

// Zillow-style layout: search + filter bar on top, map on the left, scrollable
// listing cards on the right. Same data, same stack (Next + react-map-gl + Tailwind).

type Listing = {
  id: string; title: string; address: string; lat: number; lng: number;
  roomType: "PRIVATE" | "SHARED"; totalRoommates: number; beds: number; baths: number;
  totalRent: number; rentShare: number; avgUtilities: number;
  petsAllowed: boolean; halalKitchen: boolean; genderPref: "BROTHERS" | "SISTERS" | "ANY";
  description?: string; contactEmail: string;
};

type Bounds = { w: number; s: number; e: number; n: number } | null;
type Sort = "price-asc" | "price-desc" | "roommates";

const TOKEN = process.env.NEXT_MAPBOX_TOKEN;
const PIN_ZOOM = 10;

// Two base colors (white + navy ink) do the work; gold is reserved for the active pin and "Contact lister".
const HOUSE = {
  BROTHERS: { label: "Brothers", cls: "bg-white text-brothers ring-1 ring-brothers/25" },
  SISTERS: { label: "Sisters", cls: "bg-white text-sisters ring-1 ring-sisters/25" },
  ANY: { label: "Mixed", cls: "bg-white text-ink ring-1 ring-ink/20" },
};
const BADGE = "rounded-md px-2 py-0.5 text-[13px] font-semibold";
// Listings span the Bay Area to LA; start framed on them instead of the whole state.
const START_BOUNDS: [[number, number], [number, number]] = [[-122.6, 33.8], [-117.9, 38.1]];

const usd = (n: number) => `$${n.toLocaleString()}`;
const short = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : `$${n}`);

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
  const [hovered, setHovered] = useState<string | null>(null);
  const [showPrices, setShowPrices] = useState(false);
  const [bounds, setBounds] = useState<Bounds>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  // Mobile map: tapping a pin shows a small preview card first (like Zillow), tap it for details.
  const [preview, setPreview] = useState<Listing | null>(null);
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  // Filters
  const [query, setQuery] = useState("");
  const [house, setHouse] = useState<"ALL" | Listing["genderPref"]>("ALL");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [privateOnly, setPrivateOnly] = useState(false);
  const [halalOnly, setHalalOnly] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("price-asc");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<MapRef>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Listing[]) => { setListings(d); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    if (selected) headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const activeFilters = [house !== "ALL", maxPrice != null, privateOnly, halalOnly, petsOnly].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = listings.filter((l) =>
      (!q || l.title.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)) &&
      (house === "ALL" || l.genderPref === house) &&
      (maxPrice == null || l.rentShare <= maxPrice) &&
      (!privateOnly || l.roomType === "PRIVATE") &&
      (!halalOnly || l.halalKitchen) &&
      (!petsOnly || l.petsAllowed)
    );
    return out.sort((a, b) =>
      sort === "price-asc" ? a.rentShare - b.rentShare :
      sort === "price-desc" ? b.rentShare - a.rentShare :
      a.totalRoommates - b.totalRoommates
    );
  }, [listings, query, house, maxPrice, privateOnly, halalOnly, petsOnly, sort]);

  // Like Zillow: the list shows what's in the current map view.
  const inView = useMemo(() => {
    if (!bounds) return filtered;
    return filtered.filter((l) => l.lng >= bounds.w && l.lng <= bounds.e && l.lat >= bounds.s && l.lat <= bounds.n);
  }, [filtered, bounds]);

  const syncBounds = () => {
    const b = mapRef.current?.getBounds();
    if (b) setBounds({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
  };

  const openListing = (l: Listing) => {
    setSelected(l);
    mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: Math.max(mapRef.current?.getZoom() ?? 0, PIN_ZOOM + 1), duration: 800 });
  };

  const clearFilters = () => {
    setQuery(""); setHouse("ALL"); setMaxPrice(null);
    setPrivateOnly(false); setHalalOnly(false); setPetsOnly(false);
  };

  return (
    <main className="flex h-dvh w-screen flex-col overflow-clip bg-white text-ink">
      {/* Top bar */}
      <header className="z-30 border-b border-ink/10 bg-white">
        <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink">
              <Star className="h-5 w-5 text-white" />
            </span>
            <span className="hidden font-display text-xl font-bold tracking-wide sm:block">Manara</span>
          </div>

          <label className="relative flex-1 sm:max-w-md">
            <span className="sr-only">Search by address, campus or neighborhood</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Address, campus, or neighborhood"
              className="h-11 w-full rounded-full sm:rounded-lg border border-ink/20 bg-white pl-4 pr-11 text-[15px] outline-none transition placeholder:text-ink/60 focus:border-ink focus:ring-2 focus:ring-ink/15"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </label>
        </div>

        {/* Filter chips */}
        <div className="flex snap-x items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
          <Select
            label="House"
            value={house}
            onChange={(v) => setHouse(v as typeof house)}
            options={[["ALL", "Any house"], ["BROTHERS", "Brothers"], ["SISTERS", "Sisters"], ["ANY", "Mixed"]]}
            active={house !== "ALL"}
          />
          <Select
            label="Price"
            value={maxPrice == null ? "" : String(maxPrice)}
            onChange={(v) => setMaxPrice(v ? Number(v) : null)}
            options={[["", "Any price"], ["800", "Up to $800"], ["1000", "Up to $1,000"], ["1250", "Up to $1,250"], ["1500", "Up to $1,500"], ["2000", "Up to $2,000"]]}
            active={maxPrice != null}
          />
          <Chip on={privateOnly} onClick={() => setPrivateOnly((v) => !v)}>Private room</Chip>
          <Chip on={halalOnly} onClick={() => setHalalOnly((v) => !v)}>Halal kitchen</Chip>
          <Chip on={petsOnly} onClick={() => setPetsOnly((v) => !v)}>Pets OK</Chip>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="ml-1 h-9 shrink-0 px-2 text-sm font-semibold underline underline-offset-2 [@media(pointer:coarse)]:h-11">
              Reset ({activeFilters})
            </button>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Map */}
        <section
          aria-label="Map"
          className="relative min-w-0 flex-1"
        >
          {!TOKEN ? (
            <div className="grid h-full place-items-center bg-paper p-6 text-center">
              <p className="max-w-sm text-ink/80">
                The map needs a Mapbox token. Add <code className="rounded bg-white px-1">NEXT_MAPBOX_TOKEN</code> to
                <code className="rounded bg-white px-1"> .env</code> and restart the dev server.
              </p>
            </div>
          ) : (
            <Map
              ref={mapRef}
              mapboxAccessToken={TOKEN}
              onLoad={syncBounds}
              onZoom={(e) => setShowPrices(e.viewState.zoom >= PIN_ZOOM)}
              onMoveEnd={syncBounds}
              initialViewState={{ bounds: START_BOUNDS, fitBoundsOptions: { padding: 48 } }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              onClick={() => { setSelected(null); setPreview(null); }}
            >
              <div className="hidden md:block"><NavigationControl position="top-right" showCompass={false} /></div>
              {filtered.map((l) => {
                const active = selected?.id === l.id || preview?.id === l.id || hovered === l.id;
                return (
                  <Marker
                    key={l.id}
                    longitude={l.lng}
                    latitude={l.lat}
                    anchor={showPrices ? "bottom" : "center"}
                    style={{ zIndex: active ? 3 : 1 }}
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      if (!showPrices) {
                        mapRef.current?.flyTo({ center: [l.lng, l.lat], zoom: PIN_ZOOM + 0.5, duration: 800 });
                        return;
                      }
                      if (!isDesktop()) { setPreview(l); return; }
                      setSelected(l);
                      cardRefs.current[l.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }}
                  >
                    {showPrices ? (
                      <button
                        onMouseEnter={() => setHovered(l.id)}
                        onMouseLeave={() => setHovered(null)}
                        aria-label={`${l.title}, ${usd(l.rentShare)} a month`}
                        aria-pressed={active}
                        className={`relative rounded-md px-2.5 py-1.5 text-[14px] font-bold shadow-[0_2px_6px_rgba(20,33,61,0.35)] outline-none transition-transform duration-150 ease-out focus-visible:ring-4 focus-visible:ring-ink/30 ${
                          active ? "scale-110 bg-lantern text-ink" : "bg-ink text-white"
                        }`}
                      >
                        {short(l.rentShare)}
                        <span
                          aria-hidden="true"
                          className={`absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 ${active ? "bg-lantern" : "bg-ink"}`}
                        />
                      </button>
                    ) : (
                      <button
                        aria-label={`Zoom in to rooms near ${l.address}`}
                        className="grid h-11 w-11 place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
                      >
                        <span
                          className={`rounded-full ring-2 ring-white shadow transition-all ${
                            active ? "h-4 w-4 bg-lantern" : "h-3.5 w-3.5 bg-ink"
                          }`}
                        />
                      </button>
                    )}
                  </Marker>
                );
              })}
            </Map>
          )}
          {TOKEN && !showPrices && status === "ready" && (
            <p className="glass pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-md">
              Zoom in to see prices
            </p>
          )}
        </section>

        {/* Results list */}
        <section
          aria-label="Rooms"
          className={`absolute inset-0 z-10 min-h-0 w-full overflow-y-auto overscroll-contain bg-white transition-opacity duration-200 md:static md:z-auto md:w-1/2 md:shrink-0 md:border-l md:border-ink/10 md:opacity-100 xl:w-[45%] 2xl:w-[40%] ${
            mobileView === "list" ? "opacity-100" : "pointer-events-none opacity-0 md:pointer-events-auto"
          }`}
        >
          <div className="px-4 pb-28 pt-4 sm:px-6 md:pb-8">
            <h1 className="text-lg font-bold sm:text-xl">Student rooms for rent</h1>
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="min-w-0 truncate text-sm text-ink/65">
                {status === "loading" && "Finding rooms…"}
                {status === "error" && "Couldn't load rooms. Refresh to try again."}
                {status === "ready" && (
                  <>
                    {inView.length} {inView.length === 1 ? "room" : "rooms"}
                    <span className="hidden sm:inline md:hidden xl:inline"> from verified .edu students</span>
                  </>
                )}
              </p>
              <label className="flex items-center gap-1.5 text-sm">
                <span className="hidden text-ink/65 sm:inline">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="-mr-2 min-h-[44px] cursor-pointer rounded-lg bg-transparent px-2 font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                >
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="roommates">Fewest roommates</option>
                </select>
              </label>
            </div>

            {status === "loading" && (
              <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-paper" />
                ))}
              </div>
            )}

            {status === "ready" && inView.length === 0 && (
              <div className="mt-10 rounded-xl border border-dashed border-ink/20 p-8 text-center">
                <p className="font-semibold">No rooms match here</p>
                <p className="mt-1 text-sm text-ink/65">Try zooming out or clearing filters.</p>
                <button onClick={clearFilters} className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90">
                  Clear filters
                </button>
              </div>
            )}

            {/* Cards size by percentage of the panel: 1 column on phones, 2+ as the panel widens. */}
            <ul className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
              {inView.map((l, i) => (
                <li key={l.id} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <article
                    ref={(el) => { cardRefs.current[l.id] = el; }}
                    onMouseEnter={() => setHovered(l.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`group overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(20,33,61,0.15)] ring-1 transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(20,33,61,0.18)] ${
                      selected?.id === l.id || hovered === l.id ? "ring-2 ring-ink" : "ring-ink/10"
                    }`}
                  >
                    <button onClick={() => openListing(l)} className="flex w-full text-left outline-none focus-visible:ring-4 focus-visible:ring-ink/30 sm:block">
                      <CardCover listing={l} compact />
                      <div className="min-w-0 flex-1 p-3.5">
                        <span className={`mb-2 inline-block sm:hidden ${BADGE} ${HOUSE[l.genderPref].cls}`}>{HOUSE[l.genderPref].label}</span>
                        <p className="text-2xl font-bold leading-none">
                          {usd(l.rentShare)}<span className="text-base font-medium text-ink/60">/mo</span>
                        </p>
                        <p className="mt-2 text-sm">
                          <b>{l.beds}</b> bd <span className="text-ink/30">|</span> <b>{l.baths}</b> ba{" "}
                          <span className="text-ink/30">|</span> {l.roomType === "PRIVATE" ? "Private room" : "Shared room"}
                          <span className="text-ink/60"> · {l.totalRoommates} roommates</span>
                        </p>
                        <p className="mt-1 truncate text-sm text-ink/70">{l.address}</p>
                        <Lister email={l.contactEmail} />
                      </div>
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mobile map preview card */}
        <div
          className={`absolute inset-x-3 bottom-20 z-20 transition-all duration-300 ease-out md:hidden ${
            preview && mobileView === "map" ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
          }`}
        >
          {preview && (
            <button
              onClick={() => { setSelected(preview); setPreview(null); }}
              className="glass flex w-full overflow-hidden rounded-2xl text-left shadow-[0_8px_30px_rgba(20,33,61,0.3)]"
            >
              <div className="relative w-24 shrink-0 overflow-hidden bg-ink">
                <Star className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10" />
              </div>
              <div className="min-w-0 flex-1 p-3">
                <p className="text-xl font-bold leading-none">{usd(preview.rentShare)}<span className="text-sm font-medium text-ink/60">/mo</span></p>
                <p className="mt-1.5 text-sm"><b>{preview.beds}</b> bd · <b>{preview.baths}</b> ba · {preview.roomType === "PRIVATE" ? "Private" : "Shared"}</p>
                <p className="mt-0.5 truncate text-sm text-ink/70">{preview.address}</p>
                <span className={`mt-1.5 inline-block ${BADGE} ${HOUSE[preview.genderPref].cls}`}>{HOUSE[preview.genderPref].label}</span>
              </div>
            </button>
          )}
        </div>

        {/* Mobile list/map toggle */}
        <button
          onClick={() => { setMobileView((v) => (v === "list" ? "map" : "list")); setPreview(null); }}
          className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(20,33,61,0.35)] transition active:scale-95 md:hidden ${
            selected ? "pointer-events-none opacity-0" : ""
          }`}
        >
          {mobileView === "list" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          )}
          {mobileView === "list" ? "Map" : `List (${inView.length})`}
        </button>

        {/* Detail modal (Zillow-style overlay) */}
        <div
          aria-hidden={!selected}
          onClick={() => setSelected(null)}
          className={`absolute inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            selected ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Room details"
          aria-hidden={!selected}
          className={`fixed inset-x-0 bottom-0 top-0 z-50 w-full overflow-y-auto overscroll-contain bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:absolute sm:left-auto sm:w-[min(520px,90%)] ${
            selected
              ? "translate-y-0 shadow-[-12px_0_40px_rgba(20,33,61,0.25)] sm:translate-x-0"
              : "pointer-events-none invisible translate-y-full sm:translate-y-0 sm:translate-x-full"
          }`}
        >
          {selected && (
            <div className="flex min-h-full flex-col">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-white/95 px-5 py-2.5 backdrop-blur">
                <span className={`${BADGE} ${HOUSE[selected.genderPref].cls}`}>
                  {HOUSE[selected.genderPref].label} house
                </span>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close room details"
                  className="grid h-11 w-11 place-items-center rounded-full hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <CardCover listing={selected} tall />

              <div className="flex-1 px-5 pb-6 pt-5">
                <p className="text-3xl font-bold">
                  {usd(selected.rentShare)}<span className="text-lg font-medium text-ink/60">/mo</span>
                </p>
                <p className="mt-1.5">
                  <b>{selected.beds}</b> bd <span className="text-ink/30">|</span> <b>{selected.baths}</b> ba{" "}
                  <span className="text-ink/30">|</span> {selected.totalRoommates} roommates
                </p>
                <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-lg font-semibold leading-snug outline-none">
                  {selected.title}
                </h2>
                <p className="text-ink/65">{selected.address}</p>

                <section className="mt-6 rounded-xl border border-ink/10 p-4">
                  <h3 className="font-semibold">Monthly cost</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row label="Your rent share" value={usd(selected.rentShare)} />
                    <Row label="Utilities (avg.)" value={`+ ${usd(selected.avgUtilities)}`} />
                    <Row label="Estimated total" value={usd(selected.rentShare + selected.avgUtilities)} strong />
                    <Row label="Whole apartment" value={usd(selected.totalRent)} muted />
                  </dl>
                </section>

                <h3 className="mt-6 font-semibold">Facts & features</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Fact label="Room" value={selected.roomType === "PRIVATE" ? "Private" : "Shared"} />
                  <Fact label="Roommates" value={`${selected.totalRoommates} total`} />
                  <Fact label="Bedrooms" value={selected.beds} />
                  <Fact label="Bathrooms" value={selected.baths} />
                </dl>

                <h3 className="mt-6 font-semibold">House rules</h3>
                <ul className="mt-3 space-y-2">
                  <Rule ok={selected.halalKitchen} yes="Halal kitchen" no="Kitchen isn't halal-only" />
                  <Rule ok={selected.petsAllowed} yes="Pets welcome" no="No pets" />
                </ul>

                {selected.description && (
                  <>
                    <h3 className="mt-6 font-semibold">What's special</h3>
                    <p className="mt-2 max-w-prose leading-relaxed text-ink/80">{selected.description}</p>
                  </>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <div className="flex items-center gap-3">
                <div className="shrink-0 sm:hidden">
                  <p className="text-lg font-bold leading-none">{usd(selected.rentShare + selected.avgUtilities)}</p>
                  <p className="text-xs text-ink/60">est. / month</p>
                </div>
                <a
                  href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent("Manara: " + selected.title)}`}
                  className="block flex-1 rounded-lg bg-lantern py-3.5 text-center font-bold text-ink transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Contact lister
                </a>
                </div>
                <p className="mt-2 text-center text-xs text-ink/60">{selected.contactEmail}</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

// No photos in the data yet, so cards get a branded cover with the key badges.
function CardCover({ listing: l, tall, compact }: { listing: Listing; tall?: boolean; compact?: boolean }) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-ink ${tall ? "aspect-[16/8]" : compact ? "w-[28%] sm:w-auto sm:aspect-[16/7]" : "aspect-[16/7]"}`}>
      <Star className="absolute -bottom-10 -right-8 h-40 w-40 text-white/[0.07]" />
      <div className={`absolute left-3 top-3 flex-wrap gap-1.5 ${compact ? "hidden sm:flex" : "flex"}`}>
        <span className={`${BADGE} ${HOUSE[l.genderPref].cls}`}>{HOUSE[l.genderPref].label}</span>
        {l.halalKitchen && <span className={`${BADGE} bg-white text-ink`}>Halal kitchen</span>}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`h-9 shrink-0 rounded-lg border px-3.5 [@media(pointer:coarse)]:h-11 text-sm font-semibold transition-colors ${
        on ? "border-ink bg-ink text-white" : "border-ink/25 bg-white hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Select({ label, value, onChange, options, active }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; active: boolean;
}) {
  return (
    <label className="relative shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 cursor-pointer appearance-none [@media(pointer:coarse)]:h-11 rounded-lg border pl-3.5 pr-8 text-sm font-semibold outline-none transition-colors ${
          active ? "border-ink bg-ink text-white" : "border-ink/25 bg-white hover:border-ink"
        }`}
      >
        {options.map(([v, t]) => <option key={v} value={v} className="bg-white text-ink">{t}</option>)}
      </select>
      <svg viewBox="0 0 24 24" className={`pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 ${active ? "text-white" : "text-ink"}`} aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </label>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-ink/55" : ""} ${strong ? "border-t border-ink/10 pt-2 font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-paper px-3 py-2.5">
      <dt className="text-xs text-ink/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Rule({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-sage/15 text-sage" : "bg-clay/10 text-clay"}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
          <path d={ok ? "M5 12.5l4.5 4.5L19 7.5" : "M7 7l10 10M17 7L7 17"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
      <span>{ok ? yes : no}</span>
    </li>
  );
}

// Trust signal: show which campus verified the lister (from their .edu domain).
function Lister({ email }: { email: string }) {
  const domain = email.split("@")[1] ?? "";
  return (
    <p className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3 text-sm">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-paper font-semibold uppercase">{email[0]}</span>
      <span className="min-w-0 truncate text-ink/70">Verified at <b className="text-ink">{domain}</b></span>
    </p>
  );
}
