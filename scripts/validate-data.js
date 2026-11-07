// Fails CI if seed data has outliers or missing fields.
const listings = require("../prisma/seed-data.json");

const errors = [];
listings.forEach((l, i) => {
  const tag = `#${i} "${l.title ?? "untitled"}"`;
  if (typeof l.lat !== "number" || typeof l.lng !== "number") errors.push(`${tag}: missing lat/lng`);
  else if (Math.abs(l.lat) > 90 || Math.abs(l.lng) > 180) errors.push(`${tag}: invalid coordinates`);
  for (const f of ["totalRent", "rentShare", "avgUtilities"]) {
    if (typeof l[f] !== "number") errors.push(`${tag}: ${f} missing`);
    else if (l[f] < 0) errors.push(`${tag}: ${f} is negative`);
    else if (l[f] > 10000) errors.push(`${tag}: ${f} > $10,000`);
  }
  if (l.rentShare > l.totalRent) errors.push(`${tag}: rentShare exceeds totalRent`);
  if (!["PRIVATE", "SHARED"].includes(l.roomType)) errors.push(`${tag}: bad roomType`);
  if (!["BROTHERS", "SISTERS", "ANY"].includes(l.genderPref)) errors.push(`${tag}: bad genderPref`);
});

if (errors.length) {
  console.error("Data validation failed:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log(`OK: ${listings.length} listings passed validation`);
