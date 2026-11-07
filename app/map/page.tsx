"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { campusForEmail } from "@/lib/campuses";

// Full-bleed map with frosted-glass UI floating on top (search + filter pills, results panel),
// two base colors (white + navy ink) and one accent (gold) for the active pin and "Contact lister".

type Listing = {
  id: string; title: string; address: string; lat: number; lng: number;
  roomType: "PRIVATE" | "SHARED"; totalRoommates: number; beds: number; baths: number;
  totalRent: number; rentShare: number; avgUtilities: number;
  petsAllowed: boolean; halalKitchen: boolean; genderPref: "BROTHERS" | "SISTERS" | "ANY";
  description?: string; contactEmail: string; ownerId: string | null;
};

type Bounds = { w: number; s: number; e: number; n: number } | null;
type Sort = "price-asc" | "price-desc" | "roommates";
type House = "ALL" | Listing["genderPref"];

const TOKEN = process.env.NEXT_MAPBOX_TOKEN;
const PIN_ZOOM = 9; // UCLA and USC tags stop overlapping around here

const HOUSE = {
  BROTHERS: { label: "Brothers", cls: "bg-white text-brothers ring-1 ring-brothers/25" },
  SISTERS: { label: "Sisters", cls: "bg-white text-sisters ring-1 ring-sisters/25" },
  ANY: { label: "Mixed", cls: "bg-white text-ink ring-1 ring-ink/20" },
};
const BADGE = "rounded-md px-2 py-0.5 text-[13px] font-semibold";
// Listings span Davis to La Jolla; start framed on them so no campus starts off-screen.
const START_BOUNDS: [[number, number], [number, number]] = [[-122.3, 32.8], [-117.15, 38.6]];
// Price range filter bounds (monthly rent share). A handle at either end means "no limit".
const PRICE_FLOOR = 0;
const PRICE_CEIL = 3000;
const PRICE_STEP = 50;

const isSentence = (t: string) => t.trim().split(/\s+/).length >= 3;
const usd = (n: number) => `$${n.toLocaleString()}`;
const short = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}K` : `$${n}`);
// Satellite view of the listing's block, used as the card image until listings have photos.
const snapshot = (l: Listing, w: number, h: number) =>
  `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+e9b949(${l.lng},${l.lat})/${l.lng},${l.lat},16.2,0/${w}x${h}@2x?logo=false&attribution=false&access_token=${TOKEN}`;

// Eight-point star (Rub el Hizb), the Bayt Qareeb mark.
function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1l2.6 4.4L19.8 4.2 18.6 9.4 23 12l-4.4 2.6 1.2 5.2-5.2-1.2L12 23l-2.6-4.4-5.2 1.2 1.2-5.2L1 12l4.4-2.6L4.2 4.2l5.2 1.2z" />
    </svg>
  );
}

const Icon = {
  search: <path d="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-3.5-3.5" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />,
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  dollar: <path d="M12 3v18M16.5 7.5C16 6 14.3 5 12 5s-4.5 1.2-4.5 3.2c0 4.6 9 2.4 9 7 0 2-2 3.3-4.5 3.3s-4.3-1.1-4.8-2.7" />,
  door: <path d="M6 21V4h12v17M3 21h18M14.5 12.5h.01" />,
  bowl: <path d="M3 11h18a9 9 0 01-18 0zM8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" />,
  paw: <path d="M12 13c-3 0-5.5 3.2-5.5 5.2 0 1.5 1.3 1.8 2.6 1.8 1.2 0 1.9-.6 2.9-.6s1.7.6 2.9.6c1.3 0 2.6-.3 2.6-1.8 0-2-2.5-5.2-5.5-5.2zM6 9.5a1.6 2 0 110 .01M18 9.5a1.6 2 0 110 .01M9.5 5.5a1.6 2 0 110 .01M14.5 5.5a1.6 2 0 110 .01" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  sort: <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
};
function Svg({ d, className = "h-4 w-4" }: { d: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
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
  const [preview, setPreview] = useState<Listing | null>(null);
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
  // Start the map on the student's own campus (verified email only, same rule as lib/auth.ts).
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress;
  const campus = email?.verification?.status === "verified" ? campusForEmail(email.emailAddress) : null;

  // Filters
  const [query, setQuery] = useState("");
  const [house, setHouse] = useState<House>("ALL");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [privateOnly, setPrivateOnly] = useState(false);
  const [halalOnly, setHalalOnly] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("price-asc");
  // AI search: Enter sends the sentence to /api/search, which turns it into the same filters.
  const [asking, setAsking] = useState(false);
  const [aiNote, setAiNote] = useState("");
  // After Enter, the map jumps to the searched place and the list shows every room in view,
  // so the typed text stops filtering by name.
  const [placed, setPlaced] = useState(false);
  const [placeName, setPlaceName] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<MapRef>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Listing[]) => { setListings(d); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  // /map?listing=<id> (from "See on map" and after posting) opens that listing once the map and data are in.
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => {
    if (!mapReady || status !== "ready") return;
    const id = new URLSearchParams(window.location.search).get("listing");
    const l = id && listings.find((x) => x.id === id);
    if (l) openListing(l);
  }, [mapReady, status]); // runs once both are ready; listings is set in the same update as status

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    if (selected) headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const activeFilters = [house !== "ALL", minPrice != null || maxPrice != null, privateOnly, halalOnly, petsOnly].filter(Boolean).length;

  const filtered = useMemo(() => {
    // A full sentence ("sisters room near UCLA") is for the AI search on Enter, so only short
    // text (a campus, street or city) filters as you type.
    const q = placed || isSentence(query) ? "" : query.trim().toLowerCase();
    const out = listings.filter((l) =>
      (!q || l.title.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)) &&
      (house === "ALL" || l.genderPref === house) &&
      (minPrice == null || l.rentShare >= minPrice) &&
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
  }, [listings, query, placed, house, minPrice, maxPrice, privateOnly, halalOnly, petsOnly, sort]);

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
    setQuery(""); setHouse("ALL"); setMinPrice(null); setMaxPrice(null);
    setPrivateOnly(false); setHalalOnly(false); setPetsOnly(false); setAiNote(""); setPlaced(false);
  };

  // Find a place with Mapbox geocoding and fit the map to it. Cities come back with a bounding box;
  // campuses and addresses come back as a point, so we zoom to the neighborhood around it.
  async function flyToPlace(place: string) {
    if (!TOKEN) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?country=us&limit=1&types=place,locality,neighborhood,district,poi,address&access_token=${TOKEN}`;
    const res = await fetch(url);
    const hit = res.ok ? (await res.json()).features?.[0] : null;
    if (!hit) return null;
    const padding = { top: 160, bottom: 40, left: 40, right: padRight };
    if (hit.bbox) {
      const [w, s, e, n] = hit.bbox as [number, number, number, number];
      mapRef.current?.fitBounds([[w, s], [e, n]], { padding, maxZoom: 13, duration: 1200 });
    } else {
      mapRef.current?.flyTo({ center: hit.center, zoom: 12.5, padding, duration: 1200 });
    }
    setPlaced(true);
    setPlaceName((hit.text as string) || place);
    if (!isDesktop()) setMobileView("list");
    return hit.place_name as string;
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    setAsking(true); setAiNote("");
    try {
      let place = text;
      // A sentence goes to the AI first: it sets the filters and pulls out the place ("UCLA").
      if (isSentence(text)) {
        const res = await fetch("/api/search", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        const f = data.filters ?? {};
        setHouse(f.genderPref ?? "ALL");
        setMinPrice(null);
        setMaxPrice(f.maxRent ?? null);
        setPrivateOnly(f.roomType === "PRIVATE");
        setHalalOnly(f.halalKitchen === true);
        setPetsOnly(f.petsAllowed === true);
        place = f.nearText ?? "";
      }
      const found = place ? await flyToPlace(place) : null;
      setAiNote(
        found ? `Showing rooms around ${found.split(",").slice(0, 2).join(",")}` :
        place ? `Couldn't find “${place}” on the map` :
        `Filters set from “${text}”`
      );
    } catch (err) {
      setAiNote(err instanceof Error ? err.message : "Search failed");
    } finally {
      setAsking(false);
    }
  }

  // On iPad/desktop the results panel covers the right of the map, so frame the map in the visible part.
  const padRight = typeof window !== "undefined" && isDesktop() ? Math.round(window.innerWidth * 0.46) : 24;

  return (
    <main className="relative h-dvh w-screen overflow-clip bg-paper text-ink">
      {/* Map: full-bleed background */}
      <section aria-label="Map" className="absolute inset-0">
        {!TOKEN ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <p className="max-w-sm text-ink/80">
              The map needs a Mapbox token. Add <code className="rounded bg-white px-1">NEXT_MAPBOX_TOKEN</code> to
              <code className="rounded bg-white px-1"> .env</code> and restart the dev server.
            </p>
          </div>
        ) : isLoaded && (
          // initialViewState is read once, so wait for Clerk to know the campus before mounting.
          <Map
            ref={mapRef}
            mapboxAccessToken={TOKEN}
            onLoad={(e) => { syncBounds(); setShowPrices(e.target.getZoom() >= PIN_ZOOM); setMapReady(true); }}
            onZoom={(e) => setShowPrices(e.viewState.zoom >= PIN_ZOOM)}
            onMoveEnd={syncBounds}
            initialViewState={campus
              ? { longitude: campus.lng, latitude: campus.lat, zoom: 12.5, padding: { top: 150, bottom: 40, left: 40, right: padRight } }
              : { bounds: START_BOUNDS, fitBoundsOptions: { padding: { top: 150, bottom: 40, left: 40, right: padRight } } }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            onClick={() => { setSelected(null); setPreview(null); }}
          >
            <div className="hidden md:block"><NavigationControl position="bottom-left" showCompass={false} /></div>
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
                      className={`relative rounded-full px-3 py-1.5 text-[14px] font-bold shadow-[0_4px_14px_rgba(20,33,61,0.35)] outline-none ring-2 ring-white transition-transform duration-150 ease-out focus-visible:ring-4 focus-visible:ring-ink/40 ${
                        active ? "scale-110 bg-lantern text-ink" : "bg-ink text-white"
                      }`}
                    >
                      {short(l.rentShare)}
                    </button>
                  ) : (
                    <button
                      aria-label={`Zoom in to rooms near ${l.address}`}
                      className="grid h-11 w-11 place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
                    >
                      <span className="relative grid h-5 w-5 place-items-center rounded-full bg-ink shadow-[0_2px_8px_rgba(20,33,61,0.45)] ring-[3px] ring-white">
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-lantern" : "bg-white"}`} />
                      </span>
                    </button>
                  )}
                </Marker>
              );
            })}
          </Map>
        )}
      </section>

      {/* Floating command bar: logo, one search box, filter pills */}
      <header className="pointer-events-none absolute inset-x-3 top-3 z-30 flex flex-col gap-2 md:right-[calc(46%+1.5rem)] xl:right-[calc(40%+1.5rem)]">
        <form onSubmit={search} className="glass pointer-events-auto flex h-14 items-center gap-2 rounded-2xl pl-2 pr-2.5 shadow-[0_10px_30px_rgba(20,33,61,0.18)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink">
            <Star className="h-5 w-5 text-white" />
          </span>
          <span className="hidden shrink-0 font-display text-lg font-bold tracking-wide lg:block">Bayt Qareeb</span>
          <label className="relative flex min-w-0 flex-1 items-center">
            <span className="sr-only">Search by campus, place, or describe what you want</span>
            <Svg d={Icon.search} className="pointer-events-none absolute left-3 h-5 w-5 text-ink/50" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setAiNote(""); setPlaced(false); }}
              maxLength={300}
              placeholder="Search or describe your room"
              className="h-11 w-full rounded-xl bg-white/70 pl-10 pr-3 text-[15px] outline-none ring-1 ring-ink/10 transition placeholder:text-ink/55 focus:bg-white focus:ring-2 focus:ring-ink/30"
            />
          </label>
          <button
            type="submit"
            disabled={asking || !query.trim()}
            title="Describe what you want and press Enter"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:bg-ink/25"
          >
            <Svg d={Icon.spark} className={`h-4 w-4 ${asking ? "motion-safe:animate-spin" : ""}`} />
            <span className="hidden sm:inline">{asking ? "Thinking…" : "Ask"}</span>
          </button>
          <Link
            href="/listings/new"
            aria-label="Post a room"
            // Phones keep the bar for search; Post a room and My listings are in the account menu there.
            className="hidden h-11 min-w-[44px] shrink-0 items-center sm:flex justify-center gap-1.5 rounded-xl bg-lantern px-3 text-sm font-bold text-ink transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Svg d={Icon.plus} className="h-4 w-4" />
            <span className="hidden md:inline">Post a room</span>
          </Link>
          <div className="grid h-11 w-9 shrink-0 place-items-center">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="My listings" labelIcon={<Svg d={Icon.home} />} href="/listings/mine" />
                <UserButton.Link label="Post a room" labelIcon={<Svg d={Icon.plus} />} href="/listings/new" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </form>

        <div className="pointer-events-auto -mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Dropdown
            icon={Icon.home}
            label={house === "ALL" ? "House" : HOUSE[house].label}
            active={house !== "ALL"}
            options={[["ALL", "Any house"], ["BROTHERS", "Brothers"], ["SISTERS", "Sisters"], ["ANY", "Mixed"]]}
            value={house}
            onChange={(v) => setHouse(v as House)}
          />
          <PriceFilter
            min={minPrice}
            max={maxPrice}
            onChange={(lo, hi) => { setMinPrice(lo); setMaxPrice(hi); }}
          />
          <Pill icon={Icon.door} on={privateOnly} onClick={() => setPrivateOnly((v) => !v)}>Private room</Pill>
          <Pill icon={Icon.bowl} on={halalOnly} onClick={() => setHalalOnly((v) => !v)}>Halal kitchen</Pill>
          <Pill icon={Icon.paw} on={petsOnly} onClick={() => setPetsOnly((v) => !v)}>Pets OK</Pill>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="glass h-11 shrink-0 rounded-full px-4 text-sm font-semibold underline-offset-2 hover:underline md:h-10">
              Clear ({activeFilters})
            </button>
          )}
        </div>

        {campus && !placed && !aiNote && !isSentence(query) && (
          <p className="glass pointer-events-auto hidden items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-sm font-semibold md:flex">
            <Svg d={<path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10zM12 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />} />
            Near {campus.name}
          </p>
        )}
        {!aiNote && !asking && isSentence(query) && (
          <p className="glass pointer-events-auto self-start rounded-full px-3 py-1.5 text-sm font-medium">
            Press <kbd className="rounded bg-ink/10 px-1.5 font-sans">Enter</kbd> to search with AI and jump to the place
          </p>
        )}
        {aiNote && (
          <p role="status" className="glass pointer-events-auto self-start rounded-full px-3 py-1.5 text-sm font-medium">
            {aiNote}
          </p>
        )}
        {TOKEN && !showPrices && status === "ready" && mobileView === "map" && (
          <p className="glass self-center rounded-full px-4 py-2 text-sm font-semibold md:hidden">Zoom in to see prices</p>
        )}
      </header>

      {TOKEN && !showPrices && status === "ready" && (
        <p className="glass pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-[calc(50%+23vw)] whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-md md:block xl:-translate-x-[calc(50%+20vw)]">
          Zoom in to see prices
        </p>
      )}

      {/* Results: full screen on phones, floating glass panel on iPad and desktop */}
      <section
        aria-label="Rooms"
        className={`absolute inset-0 z-10 overflow-y-auto overscroll-contain pt-[9.25rem] max-md:bg-paper transition-opacity duration-200 md:inset-auto md:bottom-3 md:right-3 md:top-3 md:w-[46%] md:rounded-3xl md:pt-0 md:opacity-100 md:shadow-[0_20px_50px_rgba(20,33,61,0.22)] md:glass xl:w-[40%] ${
          mobileView === "list" ? "opacity-100" : "pointer-events-none opacity-0 md:pointer-events-auto"
        }`}
      >
        <div className="px-4 pb-28 pt-3 md:px-5 md:pb-6 md:pt-5">
          <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h1 className="whitespace-nowrap font-display text-lg font-bold leading-tight sm:text-2xl">{placed && placeName ? `Rooms in ${placeName}` : "Rooms near campus"}</h1>
              <p className="mt-0.5 truncate text-sm text-ink/70">
                {status === "loading" && "Finding rooms…"}
                {status === "error" && "Couldn't load rooms. Refresh to try again."}
                {status === "ready" && `${inView.length} ${inView.length === 1 ? "room" : "rooms"} · verified .edu students`}
              </p>
            </div>
            <Dropdown
              icon={Icon.sort}
              label={sort === "price-asc" ? "Lowest price" : sort === "price-desc" ? "Highest price" : "Fewest roommates"}
              active={false}
              align="right"
              options={[["price-asc", "Lowest price"], ["price-desc", "Highest price"], ["roommates", "Fewest roommates"]]}
              value={sort}
              onChange={(v) => setSort(v as Sort)}
            />
          </div>

          {status === "loading" && (
            <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/70" />)}
            </div>
          )}

          {status === "ready" && inView.length === 0 && (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-ink/10">
              <p className="font-semibold">No rooms match here</p>
              <p className="mt-1 text-sm text-ink/70">Zoom out on the map or clear your filters.</p>
              <button onClick={clearFilters} className="mt-4 min-h-[44px] rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90">
                Clear filters
              </button>
            </div>
          )}

          <ul className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
            {inView.map((l, i) => (
              <li key={l.id} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <article
                  ref={(el) => { cardRefs.current[l.id] = el; }}
                  onMouseEnter={() => setHovered(l.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(20,33,61,0.08)] ring-1 transition-shadow duration-200 hover:shadow-[0_12px_28px_rgba(20,33,61,0.16)] ${
                    selected?.id === l.id || hovered === l.id ? "ring-2 ring-ink" : "ring-ink/[0.07]"
                  }`}
                >
                  <button onClick={() => openListing(l)} className="flex w-full text-left outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ink/30 sm:block">
                    <Cover listing={l} compact />
                    <div className="min-w-0 flex-1 p-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-2xl font-bold leading-none">{usd(l.rentShare)}<span className="text-base font-medium text-ink/60">/mo</span></p>
                        <span className={`sm:hidden ${BADGE} ${HOUSE[l.genderPref].cls}`}>{HOUSE[l.genderPref].label}</span>
                      </div>
                      <p className="mt-2 text-sm">
                        <b>{l.beds}</b> bd · <b>{l.baths}</b> ba · {l.roomType === "PRIVATE" ? "Private room" : "Shared room"}
                        <span className="text-ink/60"> · {l.totalRoommates} roommates</span>
                      </p>
                      <p className="mt-1 truncate text-sm text-ink/70">{l.address}</p>
                      <Lister listing={l} />
                    </div>
                  </button>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Phone map: tap a pin for a preview card */}
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
            <img src={snapshot(preview, 200, 200)} alt="" className="h-auto w-28 shrink-0 object-cover" />
            <div className="min-w-0 flex-1 p-3">
              <p className="text-xl font-bold leading-none">{usd(preview.rentShare)}<span className="text-sm font-medium text-ink/60">/mo</span></p>
              <p className="mt-1.5 text-sm"><b>{preview.beds}</b> bd · <b>{preview.baths}</b> ba · {preview.roomType === "PRIVATE" ? "Private" : "Shared"}</p>
              <p className="mt-0.5 truncate text-sm text-ink/70">{preview.address}</p>
              <span className={`mt-1.5 inline-block ${BADGE} ${HOUSE[preview.genderPref].cls}`}>{HOUSE[preview.genderPref].label}</span>
            </div>
          </button>
        )}
      </div>

      {/* Phone list/map toggle */}
      <button
        onClick={() => { setMobileView((v) => (v === "list" ? "map" : "list")); setPreview(null); }}
        className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(20,33,61,0.35)] transition active:scale-95 md:hidden ${
          selected ? "pointer-events-none opacity-0" : ""
        }`}
      >
        {mobileView === "list" ? "Map" : `List (${inView.length})`}
      </button>

      {/* Details */}
      <div
        aria-hidden={!selected}
        onClick={() => setSelected(null)}
        className={`absolute inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${selected ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Room details"
        aria-hidden={!selected}
        className={`fixed inset-0 z-50 w-full overflow-y-auto overscroll-contain bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[min(520px,92%)] sm:rounded-3xl ${
          selected
            ? "translate-y-0 shadow-[0_20px_60px_rgba(20,33,61,0.35)] sm:translate-x-0"
            : "pointer-events-none invisible translate-y-full sm:translate-y-0 sm:translate-x-[110%]"
        }`}
      >
        {selected && (
          <div className="flex min-h-full flex-col">
            <div className="relative">
              <Cover listing={selected} tall />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close room details"
                className="glass absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
              >
                <Svg d={Icon.close} className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 px-5 pb-6 pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-3xl font-bold">{usd(selected.rentShare)}<span className="text-lg font-medium text-ink/60">/mo</span></p>
                <span className={`mt-1 ${BADGE} ${HOUSE[selected.genderPref].cls}`}>{HOUSE[selected.genderPref].label} house</span>
              </div>
              <p className="mt-1.5"><b>{selected.beds}</b> bd · <b>{selected.baths}</b> ba · {selected.totalRoommates} roommates</p>
              <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-lg font-semibold leading-snug outline-none">{selected.title}</h2>
              <p className="text-ink/70">{selected.address}</p>

              <section className="mt-6 rounded-2xl bg-paper p-4">
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
              <Lister listing={selected} />
            </div>

            <div className="sticky bottom-0 border-t border-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <p className="text-lg font-bold leading-none">{usd(selected.rentShare + selected.avgUtilities)}</p>
                  <p className="text-xs text-ink/60">est. / month</p>
                </div>
                <a
                  href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent("Bayt Qareeb: " + selected.title)}`}
                  className="block flex-1 rounded-xl bg-lantern py-3.5 text-center font-bold text-ink transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Contact lister
                </a>
              </div>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

function Cover({ listing: l, tall, compact }: { listing: Listing; tall?: boolean; compact?: boolean }) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-paper ${tall ? "aspect-[16/9]" : compact ? "w-[30%] sm:w-auto sm:aspect-[16/9]" : "aspect-[16/9]"}`}>
      {TOKEN && (
        <img
          src={snapshot(l, tall ? 640 : 420, tall ? 360 : 236)}
          alt={`Map of ${l.address}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className={`absolute left-2.5 top-2.5 flex-wrap gap-1.5 ${tall ? "hidden" : compact ? "hidden sm:flex" : "flex"}`}>
        <span className={`${BADGE} shadow-sm ${HOUSE[l.genderPref].cls}`}>{HOUSE[l.genderPref].label}</span>
        {l.halalKitchen && <span className={`${BADGE} bg-white text-ink shadow-sm ring-1 ring-ink/10`}>Halal kitchen</span>}
      </div>
    </div>
  );
}

function Pill({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold shadow-[0_4px_14px_rgba(20,33,61,0.12)] transition-colors md:h-10 [@media(pointer:coarse)]:h-11 ${
        on ? "bg-ink text-white" : "glass hover:bg-white"
      }`}
    >
      <Svg d={on ? Icon.check : icon} />
      {children}
    </button>
  );
}

// Custom dropdown so filters match the glass pills instead of the browser's native <select>.
function Dropdown({ icon, label, active, options, value, onChange, align = "left" }: {
  icon: React.ReactNode; label: string; active: boolean; options: [string, string][];
  value: string; onChange: (v: string) => void; align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  return (
    <div ref={ref} className="shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 6, left: r.left, right: window.innerWidth - r.right });
          setOpen((o) => !o);
        }}
        className={`flex h-11 items-center gap-1.5 rounded-full pl-4 pr-3 text-sm font-semibold shadow-[0_4px_14px_rgba(20,33,61,0.12)] transition-colors md:h-10 [@media(pointer:coarse)]:h-11 ${
          active ? "bg-ink text-white" : "glass hover:bg-white"
        }`}
      >
        <Svg d={icon} />
        {label}
        <Svg d={Icon.chevron} className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        // Fixed so the menu isn't clipped by the horizontally scrolling pill row.
        <ul
          role="listbox"
          style={align === "right" ? { top: pos.top, right: pos.right } : { top: pos.top, left: pos.left }}
          className="glass fixed z-[60] min-w-[11rem] overflow-hidden rounded-2xl p-1.5 shadow-[0_16px_40px_rgba(20,33,61,0.22)] motion-safe:animate-fade-up"
        >
          {options.map(([v, t]) => (
            <li key={v}>
              <button
                type="button"
                role="option"
                aria-selected={v === value}
                onClick={() => { onChange(v); setOpen(false); }}
                className={`flex min-h-[44px] w-full items-center justify-between gap-4 rounded-xl px-3 text-left text-sm font-medium transition-colors ${
                  v === value ? "bg-ink text-white" : "hover:bg-ink/[0.06]"
                }`}
              >
                {t}
                {v === value && <Svg d={Icon.check} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-ink/60" : ""} ${strong ? "border-t border-ink/10 pt-2 font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2.5">
      <dt className="text-xs text-ink/60">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Rule({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-sage/15 text-sage" : "bg-clay/10 text-clay"}`}>
        <Svg d={ok ? Icon.check : Icon.close} className="h-3.5 w-3.5" />
      </span>
      <span>{ok ? yes : no}</span>
    </li>
  );
}

// Trust signal: posted listings show the campus that verified the lister (their .edu domain, which the
// server sets as contactEmail). Seed rows have no owner, so they say they're demos instead.
function Lister({ listing }: { listing: Listing }) {
  const email = listing.contactEmail;
  return (
    <p className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3 text-sm">
      {listing.ownerId ? (
        <>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-paper font-semibold uppercase">{email[0]}</span>
          <span className="min-w-0 truncate text-ink/70">Verified at <b className="text-ink">{email.split("@")[1]}</b></span>
        </>
      ) : (
        <span className="rounded-md bg-paper px-2 py-0.5 font-medium text-ink/70">Demo listing</span>
      )}
    </p>
  );
}

const clampPrice = (n: number) => Math.min(PRICE_CEIL, Math.max(PRICE_FLOOR, Math.round(n / PRICE_STEP) * PRICE_STEP));

// Min/max price: a two-handle slider plus number inputs, in a glass popover like the other filters.
function PriceFilter({ min, max, onChange }: { min: number | null; max: number | null; onChange: (min: number | null, max: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const lo = min ?? PRICE_FLOOR;
  const hi = max ?? PRICE_CEIL;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  // Ends of the slider mean "no limit" so the filter turns itself off.
  const set = (nextLo: number, nextHi: number) => {
    const a = clampPrice(Math.min(nextLo, nextHi));
    const b = clampPrice(Math.max(nextLo, nextHi));
    onChange(a <= PRICE_FLOOR ? null : a, b >= PRICE_CEIL ? null : b);
  };

  const label =
    min == null && max == null ? "Price" :
    min == null ? `Up to ${usd(max!)}` :
    max == null ? `${usd(min)}+` : `${usd(min)} – ${usd(max)}`;
  const pct = (n: number) => ((n - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;

  return (
    <div ref={ref} className="shrink-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 6, left: Math.max(12, Math.min(r.left, window.innerWidth - 312)) });
          setOpen((o) => !o);
        }}
        className={`flex h-11 items-center gap-1.5 rounded-full pl-4 pr-3 text-sm font-semibold shadow-[0_4px_14px_rgba(20,33,61,0.12)] transition-colors md:h-10 [@media(pointer:coarse)]:h-11 ${
          min != null || max != null ? "bg-ink text-white" : "glass hover:bg-white"
        }`}
      >
        <Svg d={Icon.dollar} />
        {label}
        <Svg d={Icon.chevron} className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Price range"
          style={{ top: pos.top, left: pos.left }}
          className="glass fixed z-[60] w-[300px] rounded-2xl p-4 shadow-[0_16px_40px_rgba(20,33,61,0.22)] motion-safe:animate-fade-up"
        >
          <p className="text-sm font-semibold">Your monthly rent share</p>

          {/* Two range inputs stacked on one track; only their thumbs take pointer input. */}
          <div className="relative mt-4 h-11">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink/15" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink"
              style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
            />
            <input
              type="range" aria-label="Minimum price"
              min={PRICE_FLOOR} max={PRICE_CEIL} step={PRICE_STEP} value={lo}
              onChange={(e) => set(Math.min(Number(e.target.value), hi - PRICE_STEP), hi)}
              className="range-dual"
            />
            <input
              type="range" aria-label="Maximum price"
              min={PRICE_FLOOR} max={PRICE_CEIL} step={PRICE_STEP} value={hi}
              onChange={(e) => set(lo, Math.max(Number(e.target.value), lo + PRICE_STEP))}
              className="range-dual"
            />
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <PriceInput label="Min" value={min} placeholder="No min" onCommit={(v) => set(v ?? PRICE_FLOOR, hi)} />
            <span className="pb-3 text-ink/50">–</span>
            <PriceInput label="Max" value={max} placeholder="No max" onCommit={(v) => set(lo, v ?? PRICE_CEIL)} />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => onChange(null, null)} className="min-h-[44px] px-1 text-sm font-semibold underline-offset-2 hover:underline">
              Reset
            </button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] rounded-xl bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Number box that lets you type freely and applies on blur or Enter (so "1" doesn't snap mid-typing).
function PriceInput({ label, value, placeholder, onCommit }: {
  label: string; value: number | null; placeholder: string; onCommit: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  useEffect(() => { setDraft(value == null ? "" : String(value)); }, [value]);
  const commit = () => {
    const n = Number(draft.replace(/[^0-9]/g, ""));
    onCommit(draft.trim() === "" || !Number.isFinite(n) ? null : n);
  };
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink/70">{label}</span>
      <span className="relative mt-1 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/60">$</span>
        <input
          inputMode="numeric"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          className="h-11 w-full rounded-xl bg-white pl-6 pr-2 text-[15px] font-semibold outline-none ring-1 ring-ink/15 placeholder:font-normal placeholder:text-ink/50 focus:ring-2 focus:ring-ink/40"
        />
      </span>
    </label>
  );
}
