const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const desiredMenu = [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    { label: "Brochure", href: "/brochure" },
    { label: "Sessions", href: "/sessions" },
    { label: "Speakers", href: "/speakers" },
    { label: "Venue", href: "/venue" },
    { label: "Contact Us", href: "/contact" }
  ];

  const conf = await prisma.conference.findFirst({
    where: { deletedAt: null }
  });

  if (conf) {
    await prisma.systemSetting.upsert({
      where: {
        conferenceId_key: {
          conferenceId: conf.id,
          key: "navigation_menu"
        }
      },
      update: {
        value: desiredMenu
      },
      create: {
        conferenceId: conf.id,
        key: "navigation_menu",
        value: desiredMenu
      }
    });
    console.log('Updated navigation_menu setting in DB successfully!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
