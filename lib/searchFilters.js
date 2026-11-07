// Plain CommonJS so scripts/check-search-filters.js can require it with bare node.
const GENDER = ["BROTHERS", "SISTERS", "ANY"];
const ROOM = ["PRIVATE", "SHARED"];

/**
 * @typedef {{ maxRent?: number, genderPref?: "BROTHERS"|"SISTERS"|"ANY", roomType?: "PRIVATE"|"SHARED",
 *   petsAllowed?: boolean, halalKitchen?: boolean, nearText?: string }} SearchFilters
 */

// Turns untrusted model output into a safe filter object; unknown keys and bad values are dropped.
/** @param {any} raw @returns {SearchFilters} */
function validateFilters(raw) {
  /** @type {SearchFilters} */
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const { maxRent, genderPref, roomType, petsAllowed, halalKitchen, nearText } = raw;
  if (typeof maxRent === "number" && Number.isFinite(maxRent) && maxRent > 0 && maxRent <= 10000) {
    out.maxRent = Math.round(maxRent);
  }
  if (GENDER.includes(genderPref)) out.genderPref = genderPref;
  if (ROOM.includes(roomType)) out.roomType = roomType;
  if (typeof petsAllowed === "boolean") out.petsAllowed = petsAllowed;
  if (typeof halalKitchen === "boolean") out.halalKitchen = halalKitchen;
  if (typeof nearText === "string") {
    const t = nearText.trim().slice(0, 100);
    if (t) out.nearText = t;
  }
  return out;
}

module.exports = { validateFilters };
