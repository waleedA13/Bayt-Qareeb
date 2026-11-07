import { validateListing, type ListingFields } from "@/lib/listingInput";
import { geocode } from "@/lib/geocode";

export const err = (status: number, error: string, fields?: Record<string, string>) =>
  Response.json(fields ? { error, fields } : { error }, { status });

export const notEdu = () => err(403, "Only verified .edu students can post or edit listings.");

/**
 * Parses, validates and geocodes a listing body. Pass `keep` (the stored listing) to skip
 * geocoding when the address is unchanged. Returns clean fields with server-side lat/lng, or an error Response.
 */
export async function prepareListing(req: Request, keep?: { address: string; lat: number; lng: number }) {
  // JSON only: a cross-site <form enctype="text/plain"> can't send this content type.
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return err(415, "Send the listing as JSON.");
  }
  const body = await req.json().catch(() => undefined);
  const v = validateListing(body);
  if (!v.ok) return err(400, "Please fix the highlighted fields.", v.errors);
  const data: ListingFields = v.data;

  if (keep && data.address === keep.address) return { ...data, lat: keep.lat, lng: keep.lng };

  let place;
  try {
    place = await geocode(data.address);
  } catch {
    return err(502, "We couldn't check that address right now. Please try again.");
  }
  if (!place) {
    return err(422, "We couldn't find that address in Southern California.", {
      address: "Enter a full street address in Southern California, e.g. 10920 Wilshire Blvd, Los Angeles.",
    });
  }
  // Store Mapbox's full address so the poster can see where the pin actually landed.
  return { ...data, address: place.placeName.slice(0, 200), lat: place.lat, lng: place.lng };
}
