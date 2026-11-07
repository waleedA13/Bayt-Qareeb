const assert = require("node:assert/strict");
const { validateFilters } = require("../lib/searchFilters");

const v = validateFilters;

assert.deepEqual(v(null), {});
assert.deepEqual(v("x"), {});
assert.deepEqual(v([1]), {});
assert.deepEqual(
  v({ maxRent: 900, genderPref: "SISTERS", roomType: "PRIVATE", petsAllowed: false, halalKitchen: true, nearText: " UCLA " }),
  { maxRent: 900, genderPref: "SISTERS", roomType: "PRIVATE", petsAllowed: false, halalKitchen: true, nearText: "UCLA" }
);
// unknown keys and Prisma-operator injection are dropped
assert.deepEqual(v({ ownerId: "x", where: { id: 1 }, maxRent: { lte: 5 } }), {});
// bad values
assert.deepEqual(v({ maxRent: -1 }), {});
assert.deepEqual(v({ maxRent: NaN }), {});
assert.deepEqual(v({ maxRent: "900" }), {});
assert.deepEqual(v({ maxRent: 1e9 }), {});
assert.deepEqual(v({ genderPref: "brothers" }), {});
assert.deepEqual(v({ roomType: "STUDIO" }), {});
assert.deepEqual(v({ propertyType: "CONDO" }), { propertyType: "CONDO" });
assert.deepEqual(v({ propertyType: "castle" }), {});
assert.deepEqual(v({ petsAllowed: "true", halalKitchen: 1 }), {});
assert.deepEqual(v({ nearText: "   " }), {});
assert.deepEqual(v({ nearText: 42 }), {});
assert.equal(v({ nearText: "a".repeat(500) }).nearText.length, 100);
assert.deepEqual(v({ maxRent: 899.6 }), { maxRent: 900 });

console.log("search filter checks passed");
