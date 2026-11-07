const { PrismaClient } = require("@prisma/client");
const data = require("./seed-data.json");
const prisma = new PrismaClient();

(async () => {
  // Only replace seed rows; listings students posted (ownerId set) survive a reseed.
  await prisma.listing.deleteMany({ where: { ownerId: null } });
  await prisma.listing.createMany({ data });
  console.log(`Seeded ${data.length} listings`);
  await prisma.$disconnect();
})();
