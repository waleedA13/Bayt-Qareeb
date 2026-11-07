const { PrismaClient } = require("@prisma/client");
const data = require("./seed-data.json");
const prisma = new PrismaClient();

(async () => {
  await prisma.listing.deleteMany();
  await prisma.listing.createMany({ data });
  console.log(`Seeded ${data.length} listings`);
  await prisma.$disconnect();
})();
