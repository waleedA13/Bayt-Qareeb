/** @type {import('next').NextConfig} */
module.exports = {
  // Mapbox draws in the browser, so this token is still sent to it (pk. tokens are public by design).
  env: { NEXT_MAPBOX_TOKEN: process.env.NEXT_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "" },
};
