const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
  const branding = await prisma.systemSetting.findFirst({
    where: { key: "branding_assets" }
  });
  const brandingVal = branding?.value || {};
  const fav = brandingVal.faviconUrl || "/uploads/favicon/1788709677343_tgh.png";

  const activeTheme = await prisma.themeSetting.findFirst({
    where: { isActive: true }
  });
  if (activeTheme) {
    const tokens = activeTheme.tokens || {};
    await prisma.themeSetting.update({
      where: { id: activeTheme.id },
      data: {
        tokens: {
          ...tokens,
          faviconUrl: fav
        }
      }
    });
    console.log('Synced theme tokens with favicon:', fav);
  }
}

sync().catch(console.error).finally(() => prisma.$disconnect());
