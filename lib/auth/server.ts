import { prisma } from "@/lib/prisma/client";
import { hasAdminSession } from "@/lib/security/admin-access";
export async function auth() {
  if (!(await hasAdminSession())) return { userId: null };
  return {
    userId: "mock_local_clerk_id"
  };
}

export async function currentUser() {
  const session = await auth();
  if (!session.userId) return null;
  const stored = await prisma.user.findUnique({
    where: { clerkUserId: session.userId },
    select: { firstName: true, lastName: true, email: true }
  });
  if (!stored) return null;
  return {
    id: "mock_local_clerk_id",
    firstName: stored.firstName || "",
    lastName: stored.lastName || "",
    primaryEmailAddressId: "primary",
    emailAddresses: [
      {
        id: "primary",
        emailAddress: stored.email
      }
    ]
  };
}
