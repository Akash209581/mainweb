/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/prisma/client";

export async function syncCurrentClerkUser() {
  let mockUser = await prisma.user.findFirst({
    where: { email: "admin@icgit2026.org" },
    include: {
      roles: { include: { role: true } },
      profile: { include: { organization: true } }
    }
  });

  if (!mockUser) {
    const superAdminRole = await prisma.role.findFirst({
      where: { name: "SUPER_ADMIN" }
    });
    if (!superAdminRole) {
      throw new Error("Roles are not seeded. Run 'npm run db:seed' first.");
    }
    mockUser = await prisma.user.create({
      data: {
        clerkUserId: "mock_local_clerk_id",
        email: "admin@icgit2026.org",
        firstName: "Local",
        lastName: "Admin",
        roles: {
          create: {
            roleId: superAdminRole.id
          }
        }
      },
      include: {
        roles: { include: { role: true } },
        profile: { include: { organization: true } }
      }
    });
  }
  return mockUser as any;
}
