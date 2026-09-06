const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conf = await prisma.conference.findFirst({
    where: { deletedAt: null }
  });
  console.log('Conference:', conf?.id, conf?.slug);

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['branding_assets', 'seo_metadata', 'page_content_home', 'page_content_footer'] }
    }
  });
  console.log('SystemSettings:', JSON.stringify(settings, null, 2));

  const themes = await prisma.themeSetting.findMany();
  console.log('ThemeSettings:', JSON.stringify(themes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
