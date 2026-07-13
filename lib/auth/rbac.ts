/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { PermissionKey, RoleName } from "@prisma/client";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/prisma/client";

export const routeRoleMap = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/dashboard": ["ADMIN", "SUPER_ADMIN"],
  "/reviewer": ["REVIEWER", "ADMIN", "SUPER_ADMIN"],
  "/committee": ["COMMITTEE_MEMBER", "ADMIN", "SUPER_ADMIN"],
  "/profile": ["GUEST", "AUTHOR", "REVIEWER", "COMMITTEE_MEMBER", "SPONSOR", "ADMIN", "SUPER_ADMIN"]
} satisfies Record<string, RoleName[]>;

export async function requireAuthenticatedUser() {
  let mockUser = await prisma.user.findFirst({
    where: { email: "admin@icgit2026.org" },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
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
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
  }
  return mockUser as any;
}

export async function requireRole(allowedRoles: RoleName[]) {
  const user = await requireAuthenticatedUser();
  const roleNames = user.roles.map((entry: any) => entry.role.name);
  const hasRole = roleNames.some((role: any) => allowedRoles.includes(role));

  if (!hasRole) {
    throw new AuthorizationError();
  }

  return user;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireAuthenticatedUser();
  const hasFullAccess = user.roles.some((entry: any) => entry.role.name === "SUPER_ADMIN");
  const hasPermission = user.roles.some((entry: any) =>
    entry.role.permissions.some((rolePermission: any) => rolePermission.permission.key === permission)
  );

  if (!hasFullAccess && !hasPermission) {
    throw new AuthorizationError();
  }

  return user;
}
