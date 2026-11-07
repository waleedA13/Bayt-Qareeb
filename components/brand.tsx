import Link from "next/link";

// Shared pieces for the public pages (landing, sign-in, sign-up, "Students only"), matching the map's glass UI.

const TOKEN = process.env.NEXT_MAPBOX_TOKEN;

// Still Mapbox image: same light style as /map for backdrops, satellite with a gold pin for cards (like the map's room cards).
export const staticMap = (style: string, lng: number, lat: number, zoom: number, w: number, h: number, pin = false) =>
  `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${pin ? `pin-l+e9b949(${lng},${lat})/` : ""}${lng},${lat},${zoom},0/${w}x${h}@2x?logo=false&attribution=false&access_token=${TOKEN}`;

// Eight-point star (Rub el Hizb), the Bayt Qareeb mark.
export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 1l2.6 4.4L19.8 4.2 18.6 9.4 23 12l-4.4 2.6 1.2 5.2-5.2-1.2L12 23l-2.6-4.4-5.2 1.2 1.2-5.2L1 12l4.4-2.6L4.2 4.2l5.2 1.2z" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ink/25">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink">
        <Star className="h-5 w-5 text-white" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">Bayt Qareeb</span>
    </Link>
  );
}

// Full-bleed muted map of Southern California behind public pages: the map app, standing still.
export function MapBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-paper">
      <img src={staticMap("light-v11", -117.75, 33.8, 8, 1280, 1000)} alt="" className="h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/20 via-paper/0 to-paper" />
      <p className="absolute bottom-2 right-3 text-[11px] text-ink/50">© Mapbox © OpenStreetMap</p>
    </div>
  );
}
