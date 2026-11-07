// Fails CI if seed data has outliers or missing fields.
const { CAMPUSES, milesBetween } = require("../lib/campuses");

const MAX_MILES = 5;

/** @param {any[]} listings @returns {string[]} */
function validate(listings) {
  const errors = [];
  const titles = new Set();
  listings.forEach((l, i) => {
    const tag = `#${i} "${l.title ?? "untitled"}"`;
    if (typeof l.lat !== "number" || typeof l.lng !== "number") errors.push(`${tag}: missing lat/lng`);
    else if (Math.abs(l.lat) > 90 || Math.abs(l.lng) > 180) errors.push(`${tag}: invalid coordinates`);
    else if (!CAMPUSES.some((c) => milesBetween(c, l) <= MAX_MILES)) errors.push(`${tag}: not within ${MAX_MILES} miles of a campus`);
    for (const f of ["totalRent", "rentShare", "avgUtilities"]) {
      if (typeof l[f] !== "number") errors.push(`${tag}: ${f} missing`);
      else if (l[f] < 0) errors.push(`${tag}: ${f} is negative`);
      else if (l[f] > 10000) errors.push(`${tag}: ${f} > $10,000`);
    }
    if (l.rentShare > l.totalRent) errors.push(`${tag}: rentShare exceeds totalRent`);
    if (l.totalRoommates < l.beds) errors.push(`${tag}: fewer roommates than beds`);
    if (!["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE"].includes(l.propertyType)) errors.push(`${tag}: bad propertyType`);
    if (!["PRIVATE", "SHARED"].includes(l.roomType)) errors.push(`${tag}: bad roomType`);
    if (!["BROTHERS", "SISTERS", "ANY"].includes(l.genderPref)) errors.push(`${tag}: bad genderPref`);
    if (l.photos !== undefined) {
      if (!Array.isArray(l.photos)) errors.push(`${tag}: photos must be an array`);
      else if (l.photos.length > 8) errors.push(`${tag}: more than 8 photos`);
      else if (l.photos.some((u) => typeof u !== "string" || !/^https:\/\//.test(u))) errors.push(`${tag}: photos must be https URLs`);
    }
    // Seed contacts must be fake so no real student gets emailed.
    if (!/^[^\s@]+@example\.edu$/i.test(l.contactEmail ?? "")) errors.push(`${tag}: contactEmail must end in @example.edu`);
    const key = String(l.title ?? "").trim().toLowerCase();
    if (titles.has(key)) errors.push(`${tag}: duplicate title`);
    titles.add(key);
  });
  return errors;
}

if (require.main === module) {
  const listings = require("../prisma/seed-data.json");
  const errors = validate(listings);
  if (errors.length) {
    console.error("Data validation failed:\n" + errors.map((e) => " - " + e).join("\n"));
    process.exit(1);
  }
  console.log(`OK: ${listings.length} listings passed validation`);
}

module.exports = { validate };
