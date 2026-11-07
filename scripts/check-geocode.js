// Self-check for the Mapbox response parser in lib/geocode.js. Run: node scripts/check-geocode.js
const assert = require("node:assert/strict");
const { parseGeocode: p } = require("../lib/geocode");

const feature = (lng, lat, full_address = "10920 Wilshire Blvd, Los Angeles, California 90024, United States") => ({
  type: "FeatureCollection",
  features: [{ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: { full_address } }],
});

assert.deepEqual(p(feature(-118.44, 34.06)), {
  lat: 34.06, lng: -118.44, placeName: "10920 Wilshire Blvd, Los Angeles, California 90024, United States",
});
// no match
assert.equal(p({ type: "FeatureCollection", features: [] }), null);
// garbage
for (const bad of [null, undefined, "x", {}, { features: "x" }, { features: [{}] }, { features: [{ geometry: { coordinates: ["a", "b"] } }] }]) {
  assert.equal(p(bad), null);
}
assert.equal(p(feature(NaN, 34)), null);
// outside Southern California (San Francisco, New York)
assert.equal(p(feature(-122.42, 37.77)), null);
assert.equal(p(feature(-74.0, 40.7)), null);
// too vague to pin a room: a whole city, region or zip code
const typed = (feature_type, match_code) => {
  const j = feature(-118.24, 34.05);
  Object.assign(j.features[0].properties, { feature_type, match_code });
  return p(j);
};
for (const t of ["place", "region", "postcode", "district", "country"]) assert.equal(typed(t), null, t);
assert.ok(typed("neighborhood")); // e.g. "UC Irvine"
assert.ok(typed("street"));
// a street Mapbox couldn't find, with a made-up number ("123 Fake Street, Riverside")
assert.equal(typed("address", { address_number: "plausible", street: "unmatched" }), null);
assert.ok(typed("address", { address_number: "matched", street: "unmatched" })); // real number, odd street name
assert.ok(typed("address", { address_number: "matched", street: "matched", place: "unmatched" }));

// missing place name falls back to a usable string
assert.equal(typeof p(feature(-117.16, 32.72, undefined)).placeName, "string");

console.log("geocode checks passed");
