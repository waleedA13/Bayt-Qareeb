// Server-side Mapbox geocoding. Plain CommonJS so scripts/check-geocode.js can require it with bare node.
// Listing coordinates only ever come from here, never from the client.

// [west, south, east, north]: Santa Barbara/Kern down to the Mexico border, coast to the Arizona line.
const SOCAL_BBOX = [-120.7, 32.5, -114.1, 35.8];

// A pin at a city or zip-code centre would mislead people browsing the map.
const TOO_VAGUE = ["place", "region", "postcode", "district", "country"];

/** @typedef {{ lat: number, lng: number, placeName: string }} GeoResult */

/** Parses a Mapbox Geocoding v6 forward response. @param {any} json @returns {GeoResult | null} */
function parseGeocode(json) {
  const f = Array.isArray(json?.features) ? json.features[0] : null;
  const [lng, lat] = Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates : [];
  if (typeof lng !== "number" || typeof lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const [w, s, e, n] = SOCAL_BBOX;
  if (lng < w || lng > e || lat < s || lat > n) return null; // bbox is a hint to Mapbox, not a guarantee
  const p = f.properties ?? {};
  if (TOO_VAGUE.includes(p.feature_type)) return null;
  if (p.match_code?.street === "unmatched" && p.match_code?.address_number !== "matched") return null;
  const placeName = typeof p.full_address === "string" ? p.full_address : typeof p.name === "string" ? p.name : `${lat}, ${lng}`;
  return { lat, lng, placeName };
}

/** @param {string} address @returns {Promise<GeoResult | null>} throws on network or Mapbox errors */
async function geocode(address) {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({
    q: address, country: "us", bbox: SOCAL_BBOX.join(","), limit: "1",
    access_token: process.env.NEXT_MAPBOX_TOKEN || "",
  }).toString();
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Mapbox geocoding failed: HTTP ${res.status}`);
  return parseGeocode(await res.json());
}

module.exports = { SOCAL_BBOX, parseGeocode, geocode };
