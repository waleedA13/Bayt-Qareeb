// Self-check for lib/listingInput.js. Run: node scripts/check-listing-input.js
const assert = require("node:assert/strict");
const { validateListing: v } = require("../lib/listingInput");

const good = {
  title: "  Room near UCLA  ", address: " 10920 Wilshire Blvd, Los Angeles ", roomType: "PRIVATE",
  totalRoommates: 3, beds: 3, baths: 1.5, totalRent: 4200, rentShare: 1400, avgUtilities: 90,
  petsAllowed: false, halalKitchen: true, genderPref: "BROTHERS", description: "  Quiet, close to campus. ",
};
const clean = {
  title: "Room near UCLA", address: "10920 Wilshire Blvd, Los Angeles", roomType: "PRIVATE",
  totalRoommates: 3, beds: 3, baths: 1.5, totalRent: 4200, rentShare: 1400, avgUtilities: 90,
  petsAllowed: false, halalKitchen: true, genderPref: "BROTHERS", description: "Quiet, close to campus.",
};
const err = (patch) => {
  const r = v({ ...good, ...patch });
  assert.equal(r.ok, false, `expected errors for ${JSON.stringify(patch).slice(0, 60)}`);
  return r.errors;
};

// valid input is trimmed and returned
assert.deepEqual(v(good), { ok: true, data: clean });
// unknown and server-owned keys are dropped
assert.deepEqual(v({ ...good, ownerId: "x", lat: 1, lng: 2, contactEmail: "a@b.c", id: "y", createdAt: 0 }), { ok: true, data: clean });
// numeric strings from form inputs are accepted
assert.deepEqual(v({ ...good, totalRent: " 4200", rentShare: "1400", baths: "1.5", beds: "3", totalRoommates: "3", avgUtilities: "90" }), { ok: true, data: clean });
// optional fields: empty description -> null, booleans default like the schema
const { petsAllowed, halalKitchen, description, ...noOptional } = good;
assert.deepEqual(v(noOptional), { ok: true, data: { ...clean, petsAllowed: false, halalKitchen: true, description: null } });
assert.equal(v({ ...good, description: "   " }).data.description, null);
// zero rent/utilities is allowed
assert.equal(v({ ...good, rentShare: 0, avgUtilities: 0 }).ok, true);

// non-object input
for (const bad of [null, undefined, "x", 42, [good]]) assert.equal(v(bad).ok, false);

// money rules from scripts/validate-data.js
assert.ok(err({ totalRent: -1 }).totalRent);
assert.ok(err({ avgUtilities: -5 }).avgUtilities);
assert.ok(err({ totalRent: 10001, rentShare: 100 }).totalRent);
assert.ok(err({ rentShare: 4201 }).rentShare);
assert.ok(err({ totalRent: "abc" }).totalRent);
assert.ok(err({ totalRent: "" }).totalRent);
assert.ok(err({ totalRent: null }).totalRent);
assert.ok(err({ totalRent: 1200.5 }).totalRent);
assert.ok(err({ totalRent: { gt: 0 } }).totalRent);
// enums
assert.ok(err({ roomType: "STUDIO" }).roomType);
assert.ok(err({ genderPref: "brothers" }).genderPref);
assert.ok(err({ genderPref: undefined }).genderPref);
// integer ranges
assert.ok(err({ totalRoommates: 0 }).totalRoommates);
assert.ok(err({ totalRoommates: 21 }).totalRoommates);
assert.ok(err({ beds: 2.5 }).beds);
assert.ok(err({ beds: -1 }).beds);
// baths in 0.5 steps
assert.ok(err({ baths: 1.25 }).baths);
assert.ok(err({ baths: 0 }).baths);
assert.ok(err({ baths: 11 }).baths);
assert.equal(v({ ...good, baths: 2 }).ok, true);
// booleans must be real booleans
assert.ok(err({ petsAllowed: "true" }).petsAllowed);
// text lengths, measured after trimming
assert.ok(err({ title: "a".repeat(81) }).title);
assert.equal(v({ ...good, title: " " + "a".repeat(80) + " " }).ok, true);
assert.ok(err({ title: "   " }).title);
assert.ok(err({ title: 5 }).title);
assert.ok(err({ address: "a".repeat(201) }).address);
assert.ok(err({ address: "" }).address);
assert.ok(err({ description: "a".repeat(1001) }).description);
assert.ok(err({ description: 7 }).description);
// several errors reported at once
assert.deepEqual(Object.keys(err({ title: "", roomType: "X", baths: 0.3 })).sort(), ["baths", "roomType", "title"]);

console.log("listing input checks passed");
