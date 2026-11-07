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

// The Bayt Qareeb mark: a gold roofline (with chimney) under a crescent and star, on a navy tile.
// Drawn as SVG so it stays crisp from the 32px browser tab up to the landing page.
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Bayt Qareeb" className={className}>
      <defs>
        <linearGradient id="bq-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1C3B66" />
          <stop offset="1" stopColor="#0F1E3A" />
        </linearGradient>
        <linearGradient id="bq-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6E3A8" />
          <stop offset="1" stopColor="#D4AE58" />
        </linearGradient>
        <linearGradient id="bq-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9CF86" />
          <stop offset="1" stopColor="#7FA3D1" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bq-glow" cx="0.5" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#6E9BD6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#6E9BD6" stopOpacity="0" />
        </radialGradient>
        <mask id="bq-crescent">
          <circle cx="30" cy="11" r="5" fill="#fff" />
          <circle cx="32.4" cy="9.4" r="4.4" fill="#000" />
        </mask>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#bq-bg)" />
      <path d="M17 35 L32 22 L47 35 V55 H17 Z" fill="url(#bq-glow)" />
      <path d="M17 35 V55 M47 35 V55" stroke="url(#bq-wall)" strokeWidth="3.4" />
      <path d="M40.5 27.5 V19.5 H45 V31.5" fill="url(#bq-gold)" />
      <path d="M11 37.5 L32 19.5 L53 37.5" fill="none" stroke="url(#bq-gold)" strokeWidth="4.6" strokeLinejoin="miter" />
      <circle cx="30" cy="11" r="5" fill="url(#bq-gold)" mask="url(#bq-crescent)" />
      <path fill="#F6E3A8" d="M36.6 6.8l.6 1.3 1.4.1-1.1.9.4 1.4-1.3-.8-1.2.8.4-1.4-1.1-.9 1.4-.1z" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ink/25">
      <LogoMark className="h-10 w-10 shrink-0" />
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
