import { prisma } from "@/lib/prisma/client";
import { requireAuthenticatedUser } from "@/lib/auth/rbac";

/** The legacy profile screen is restricted to the authenticated administrator. */
export async function syncCurrentClerkUser() {
  const user = await requireAuthenticatedUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      roles: { include: { role: true } },
      profile: { include: { organization: true } }
    }
  });
}
