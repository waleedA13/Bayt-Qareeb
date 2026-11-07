const assert = require("node:assert/strict");
const { CAMPUSES, campusForEmail } = require("../lib/campuses");
const { validate } = require("./validate-data");

const c = (email) => campusForEmail(email)?.domain ?? null;

// campusForEmail
assert.equal(CAMPUSES.length, 7);
assert.equal(c("yusuf@ucla.edu"), "ucla.edu");
assert.equal(c("a@usc.edu"), "usc.edu");
assert.equal(c("a@ucr.edu"), "ucr.edu");
assert.equal(c("a@ucsd.edu"), "ucsd.edu");
assert.equal(c("a@uci.edu"), "uci.edu");
assert.equal(c("a@ucdavis.edu"), "ucdavis.edu");
assert.equal(c("a@cs.stanford.edu"), "stanford.edu");
assert.equal(c("a@notstanford.edu"), null);
assert.equal(c("a@eng.ucsd.edu"), "ucsd.edu"); // subdomain
assert.equal(c("Bob@UCLA.EDU"), "ucla.edu"); // case-insensitive
assert.equal(c("name+clerk_test@ucsd.edu"), "ucsd.edu");
assert.equal(c("a@notucla.edu"), null); // lookalike, not a subdomain
assert.equal(c("a@ucla.edu.evil.com"), null);
assert.equal(c("a@berkeley.edu"), null);
assert.equal(c("ucla.edu"), null);
assert.equal(c(""), null);
assert.equal(c(null), null);
assert.equal(c(undefined), null);

// validate(): a good listing passes, each broken copy reports its own error
const good = {
  title: "Test room", address: "Gayley Ave, Westwood, CA", lat: 34.0663, lng: -118.45,
  roomType: "PRIVATE", totalRoommates: 3, beds: 3, baths: 2,
  totalRent: 4200, rentShare: 1400, avgUtilities: 90,
  petsAllowed: false, halalKitchen: true, genderPref: "BROTHERS",
  description: "x", contactEmail: "ucla-brothers-01@example.edu",
};
const errs = (patch) => validate([{ ...good, ...patch }]).join("\n");
assert.deepEqual(validate([good]), []);
assert.match(errs({ lat: 37.8676, lng: -122.259 }), /within 5 miles/); // Berkeley
assert.match(errs({ rentShare: 5000 }), /rentShare exceeds totalRent/);
assert.match(errs({ totalRoommates: 2 }), /fewer roommates than beds/);
assert.match(errs({ contactEmail: "yusuf@ucla.edu" }), /@example\.edu/);
assert.match(errs({ contactEmail: "x@example.edu.ucla.edu" }), /@example\.edu/);
assert.match(validate([good, { ...good }]).join("\n"), /duplicate title/);
assert.match(validate([good, { ...good, title: " TEST ROOM " }]).join("\n"), /duplicate title/);

console.log("campus checks passed");
