// Plain CommonJS (like searchFilters.js) so scripts/validate-data.js can require it with bare Node 20 in CI.

/** @typedef {{ domain: string, name: string, lat: number, lng: number }} Campus */

/** @type {Campus[]} */
const CAMPUSES = [
  { domain: "ucla.edu", name: "UCLA", lat: 34.0689, lng: -118.4452 },
  { domain: "usc.edu", name: "USC", lat: 34.0224, lng: -118.2851 },
  { domain: "ucr.edu", name: "UC Riverside", lat: 33.9737, lng: -117.3281 },
  { domain: "ucsd.edu", name: "UCSD", lat: 32.8801, lng: -117.234 },
  { domain: "uci.edu", name: "UC Irvine", lat: 33.6405, lng: -117.8443 },
  { domain: "ucdavis.edu", name: "UC Davis", lat: 38.5382, lng: -121.7617 },
  { domain: "stanford.edu", name: "Stanford", lat: 37.4275, lng: -122.1697 },
];

// Matches the exact domain or a subdomain (eng.ucsd.edu), never a lookalike (notucla.edu).
/** @param {string | null | undefined} email @returns {Campus | null} */
function campusForEmail(email) {
  const host = (email ?? "").toLowerCase().split("@")[1];
  if (!host || email.split("@").length !== 2) return null;
  return CAMPUSES.find((c) => host === c.domain || host.endsWith("." + c.domain)) ?? null;
}

// Haversine distance in miles.
/** @param {{lat: number, lng: number}} a @param {{lat: number, lng: number}} b */
function milesBetween(a, b) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

module.exports = { CAMPUSES, campusForEmail, milesBetween };
