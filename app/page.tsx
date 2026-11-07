"use client";

import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";

type Listing = {
  id: string; title: string; address: string; lat: number; lng: number;
  roomType: "PRIVATE" | "SHARED"; totalRoommates: number; beds: number; baths: number;
  totalRent: number; rentShare: number; avgUtilities: number;
  petsAllowed: boolean; halalKitchen: boolean; genderPref: "BROTHERS" | "SISTERS" | "ANY";
  description?: string; contactEmail: string;
};

const GENDER = {
  BROTHERS: { label: "Brothers only", cls: "bg-sky-100 text-sky-800" },
  SISTERS: { label: "Sisters only", cls: "bg-rose-100 text-rose-800" },
  ANY: { label: "Any (separate spaces)", cls: "bg-slate-100 text-slate-700" },
};

const usd = (n: number) => `$${n.toLocaleString()}`;

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);

  useEffect(() => {
    fetch("/api/listings").then((r) => r.json()).then(setListings);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <header className="absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-4 py-2 shadow-lg">
        <h1 className="text-lg font-bold text-emerald-700">Manara</h1>
        <p className="text-xs text-slate-500">Verified .edu students only · {listings.length} rooms</p>
      </header>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: -120.5, latitude: 36.0, zoom: 5.3 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={() => setSelected(null)}
      >
        <NavigationControl position="bottom-right" />
        {listings.map((l) => (
          <Marker key={l.id} longitude={l.lng} latitude={l.lat} anchor="bottom">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(l); }}
              className={`rounded-full px-3 py-1 text-sm font-semibold shadow-md transition hover:scale-110 ${
                selected?.id === l.id ? "bg-emerald-700 text-white" : "bg-white text-slate-900"
              }`}
            >
              {usd(l.rentShare)}
            </button>
          </Marker>
        ))}
      </Map>

      <aside
        className={`absolute right-0 top-0 z-20 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <div className="p-6">
            <button onClick={() => setSelected(null)} className="mb-4 text-sm text-slate-500 hover:text-slate-900">
              ✕ Close
            </button>

            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${GENDER[selected.genderPref].cls}`}>
              {GENDER[selected.genderPref].label}
            </span>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{selected.title}</h2>
            <p className="text-sm text-slate-500">{selected.address}</p>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Your share</p>
              <p className="text-3xl font-bold text-emerald-800">
                {usd(selected.rentShare)}<span className="text-base font-normal">/mo</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                <div>Total rent: <b>{usd(selected.totalRent)}</b></div>
                <div>Avg utilities: <b>{usd(selected.avgUtilities)}</b></div>
                <div className="col-span-2">
                  Est. monthly total: <b>{usd(selected.rentShare + selected.avgUtilities)}</b>
                </div>
              </div>
            </div>

            <h3 className="mt-6 font-semibold text-slate-900">The space</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Room" value={selected.roomType === "PRIVATE" ? "Private" : "Shared"} />
              <Stat label="Roommates" value={selected.totalRoommates} />
              <Stat label="Beds" value={selected.beds} />
              <Stat label="Baths" value={selected.baths} />
            </div>

            <h3 className="mt-6 font-semibold text-slate-900">House rules</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <Rule ok={selected.halalKitchen} label="Halal kitchen" />
              <Rule ok={selected.petsAllowed} label="Pets allowed" />
            </ul>

            {selected.description && <p className="mt-6 text-sm leading-relaxed text-slate-700">{selected.description}</p>}

            <a
              href={`mailto:${selected.contactEmail}?subject=${encodeURIComponent("Manara: " + selected.title)}`}
              className="mt-8 block rounded-xl bg-emerald-700 py-3 text-center font-semibold text-white hover:bg-emerald-800"
            >
              Message {selected.contactEmail}
            </a>
          </div>
        )}
      </aside>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={ok ? "text-emerald-600" : "text-rose-500"}>{ok ? "✓" : "✕"}</span>
      <span className={ok ? "text-slate-900" : "text-slate-500 line-through"}>{label}</span>
    </li>
  );
}
