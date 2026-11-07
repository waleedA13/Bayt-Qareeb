import seedListings from "@/prisma/seed-data.json";

const listings = seedListings.map((listing, index) => ({
  id: `placeholder-${index + 1}`,
  ...listing,
}));

export async function GET() {
  return Response.json(listings);
}
