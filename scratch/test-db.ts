import { PrismaClient } from "@prisma/client";

const ports = [5432, 5433];
const users = ["postgres", "banda", "akash"];
const passwords = [
  "",
  "postgres",
  "admin",
  "password",
  "1234",
  "12345",
  "123456",
  "root",
  "akash",
  "akash@12345",
  "daniel",
  "daniel123",
  "icgit",
  "icgit2026",
  "Admin@12345",
  "admin@12345",
  "postgres@12345",
  "Postgres@12345",
  "postgres@1234",
  "Postgres@1234",
  "root@123",
  "root@12345",
  "root@1234",
  "123",
  "12345678",
  "123456789",
  "postgres123",
  "Postgres@123",
  "Postgres123",
  "vignan",
  "vignan123",
  "vignan@123",
  "Vignan@123",
  "Vignan@12345",
  "Vignan",
  "Banda@123",
  "Banda@1234",
  "Banda@12345",
  "Banda@123456",
  "Banda",
  "banda"
];

async function test() {
  for (const port of ports) {
    for (const user of users) {
      for (const password of passwords) {
        const url = `postgresql://${user}:${password}@localhost:${port}/icgit2026?schema=public`;
        // console.log(`Testing port: ${port}, user: "${user}", password: "${password}"...`);
        const prisma = new PrismaClient({
          datasources: {
            db: { url }
          }
        });

        try {
          await prisma.$connect();
          console.log(`SUCCESS! Port: ${port}, User: "${user}", password: "${password}"`);
          await prisma.$disconnect();
          return;
        } catch (err: any) {
          if (err.message && !err.message.includes("Authentication failed")) {
            console.log(`SUCCESS (Auth ok, connection error on port ${port}): ${err.message?.split("\n")[0]}`);
            console.log(`The correct credentials are port: ${port}, user: "${user}", password: "${password}"`);
            await prisma.$disconnect();
            return;
          }
        } finally {
          await prisma.$disconnect();
        }
      }
    }
  }
  console.log("No valid credentials found.");
}

test();
