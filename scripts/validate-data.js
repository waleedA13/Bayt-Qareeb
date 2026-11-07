// Fails CI if seed data has outliers or missing fields.
const { CAMPUSES, milesBetween } = require("../lib/campuses");
const { validateListing } = require("../lib/listingInput");

const MAX_MILES = 5;

/** @param {any[]} listings @returns {string[]} */
function validate(listings) {
  const errors = [];
  const titles = new Set();
  listings.forEach((l, i) => {
    const tag = `#${i} "${l.title ?? "untitled"}"`;
    // Same field rules as posted listings (money, enums, ranges, text lengths).
    const v = validateListing(l);
    if (!v.ok) for (const [field, msg] of Object.entries(v.errors)) errors.push(`${tag}: ${field}: ${msg}`);
    // Seed-only rules: seed rows carry their own coordinates, sit near a campus, and use fake contacts.
    if (typeof l.lat !== "number" || typeof l.lng !== "number") errors.push(`${tag}: missing lat/lng`);
    else if (Math.abs(l.lat) > 90 || Math.abs(l.lng) > 180) errors.push(`${tag}: invalid coordinates`);
    else if (!CAMPUSES.some((c) => milesBetween(c, l) <= MAX_MILES)) errors.push(`${tag}: not within ${MAX_MILES} miles of a campus`);
    // Seed contacts must be fake so no real student gets emailed. (Posted listings use the owner's verified email.)
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
