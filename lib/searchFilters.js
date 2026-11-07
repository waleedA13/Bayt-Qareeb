// Plain CommonJS so scripts/check-search-filters.js can require it with bare node.
const GENDER = ["BROTHERS", "SISTERS", "ANY"];
const ROOM = ["PRIVATE", "SHARED"];
const PROPERTY = ["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE"];

/**
 * @typedef {{ maxRent?: number, genderPref?: "BROTHERS"|"SISTERS"|"ANY", roomType?: "PRIVATE"|"SHARED", propertyType?: "HOUSE"|"APARTMENT"|"CONDO"|"TOWNHOUSE",
 *   petsAllowed?: boolean, halalKitchen?: boolean, nearText?: string }} SearchFilters
 */

// Turns untrusted model output into a safe filter object; unknown keys and bad values are dropped.
/** @param {any} raw @returns {SearchFilters} */
function validateFilters(raw) {
  /** @type {SearchFilters} */
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const { maxRent, genderPref, roomType, propertyType, petsAllowed, halalKitchen, nearText } = raw;
  if (typeof maxRent === "number" && Number.isFinite(maxRent) && maxRent > 0 && maxRent <= 10000) {
    out.maxRent = Math.round(maxRent);
  }
  if (GENDER.includes(genderPref)) out.genderPref = genderPref;
  if (ROOM.includes(roomType)) out.roomType = roomType;
  if (PROPERTY.includes(propertyType)) out.propertyType = propertyType;
  if (typeof petsAllowed === "boolean") out.petsAllowed = petsAllowed;
  if (typeof halalKitchen === "boolean") out.halalKitchen = halalKitchen;
  if (typeof nearText === "string") {
    const t = nearText.trim().slice(0, 100);
    if (t) out.nearText = t;
  }
  return out;
}

module.exports = { validateFilters };
