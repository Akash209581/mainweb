import { prisma } from "./lib/prisma/client";

async function main() {
  const themes = await prisma.themeSetting.findMany();
  console.log("THEMES:", JSON.stringify(themes, null, 2));
  
  const activeTheme = await prisma.themeSetting.findFirst({ where: { isActive: true } });
  console.log("ACTIVE THEME:", JSON.stringify(activeTheme, null, 2));

  const users = await prisma.user.findMany({ include: { roles: { include: { role: true } } } });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().catch(console.error);
