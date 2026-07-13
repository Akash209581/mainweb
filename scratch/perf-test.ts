import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing database queries performance...");
  
  let start = Date.now();
  const speakerCount = await prisma.speaker.count();
  console.log(`Speaker count query took ${Date.now() - start}ms, Count: ${speakerCount}`);

  start = Date.now();
  const trackCount = await prisma.track.count();
  console.log(`Track count query took ${Date.now() - start}ms, Count: ${trackCount}`);

  start = Date.now();
  const packageCount = await prisma.registrationPackage.count();
  console.log(`RegistrationPackage count query took ${Date.now() - start}ms, Count: ${packageCount}`);

  start = Date.now();
  const countryCount = await prisma.country.count();
  console.log(`Country count query took ${Date.now() - start}ms, Count: ${countryCount}`);

  start = Date.now();
  const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
  console.log(`Fetching all countries took ${Date.now() - start}ms, Fetched: ${countries.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
