// Plain CommonJS so scripts/check-listing-input.js can require it with bare node.
// Same rules as scripts/validate-data.js (which should switch to this module later), plus form-input rules.
const ROOM = ["PRIVATE", "SHARED"];
const GENDER = ["BROTHERS", "SISTERS", "ANY"];
const MAX_MONEY = 10000;

/**
 * @typedef {{ title: string, address: string, roomType: "PRIVATE"|"SHARED", totalRoommates: number, beds: number,
 *   baths: number, totalRent: number, rentShare: number, avgUtilities: number, petsAllowed: boolean,
 *   halalKitchen: boolean, genderPref: "BROTHERS"|"SISTERS"|"ANY", description: string|null }} ListingFields
 * @typedef {{ ok: true, data: ListingFields } | { ok: false, errors: Record<string, string> }} ListingResult
 */

// Form inputs send strings; accept "1200" but not "", "abc", objects or NaN.
const num = (x) => (typeof x === "number" ? x : typeof x === "string" && x.trim() !== "" ? Number(x) : NaN);

/** @param {unknown} raw @returns {ListingResult} */
function validateListing(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: { _: "Expected a listing object." } };
  const r = /** @type {Record<string, unknown>} */ (raw);
  /** @type {Record<string, string>} */
  const errors = {};
  /** @type {Record<string, unknown>} */
  const data = {};

  const text = (key, label, max, required) => {
    const x = r[key];
    const t = x == null ? "" : typeof x === "string" ? x.trim() : null;
    if (t === null) errors[key] = `${label} must be text.`;
    else if (!t) {
      if (required) errors[key] = `${label} is required.`;
      else data[key] = null;
    } else if (t.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
    else data[key] = t;
  };
  const int = (key, label, min, max) => {
    const n = num(r[key]);
    if (!Number.isInteger(n) || n < min || n > max) errors[key] = `${label} must be a whole number from ${min} to ${max.toLocaleString("en-US")}.`;
    else data[key] = n;
  };
  const oneOf = (key, label, list) => {
    if (list.includes(r[key])) data[key] = r[key];
    else errors[key] = `Choose a ${label}.`;
  };
  const bool = (key, label, fallback) => {
    const x = r[key];
    if (x === undefined) data[key] = fallback;
    else if (typeof x === "boolean") data[key] = x;
    else errors[key] = `${label} must be yes or no.`;
  };

  text("title", "Title", 80, true);
  text("address", "Address", 200, true);
  oneOf("roomType", "room type", ROOM);
  int("totalRoommates", "Roommates", 1, 20);
  int("beds", "Beds", 0, 20);
  const baths = num(r.baths);
  if (!Number.isInteger(baths * 2) || baths < 0.5 || baths > 10) errors.baths = "Baths must be 0.5 to 10, in steps of 0.5.";
  else data.baths = baths;
  int("totalRent", "Total rent", 0, MAX_MONEY);
  int("rentShare", "Your share", 0, MAX_MONEY);
  int("avgUtilities", "Utilities", 0, MAX_MONEY);
  if (!errors.totalRent && !errors.rentShare && /** @type {number} */ (data.rentShare) > /** @type {number} */ (data.totalRent)) {
    errors.rentShare = "Your share can't be more than the total rent.";
  }
  bool("petsAllowed", "Pets allowed", false);
  bool("halalKitchen", "Halal kitchen", true);
  oneOf("genderPref", "house type", GENDER);
  text("description", "Description", 1000, false);

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: /** @type {ListingFields} */ (data) };
}

module.exports = { validateListing };
