import { NotFoundError } from "@/lib/errors/app-error";
import type { Prisma, RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export async function findUserByClerkId(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      profile: { include: { organization: true } },
      roles: {
        include: { role: { include: { permissions: { include: { permission: true } } } } }
      }
    }
  });
}

export async function upsertUserFromClerk(input: {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const guestRole = await prisma.role.findUnique({ where: { name: "GUEST" } });

  return prisma.user.upsert({
    where: { clerkUserId: input.clerkUserId },
    update: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      profile: {
        upsert: {
          update: {},
          create: {}
        }
      }
    },
    create: {
      clerkUserId: input.clerkUserId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      profile: { create: {} },
      roles: guestRole
        ? {
            create: {
              roleId: guestRole.id
            }
          }
        : undefined
    },
    include: {
      profile: { include: { organization: true } },
      roles: { include: { role: true } }
    }
  });
}

export async function updateUserProfile(
  clerkUserId: string,
  data: Prisma.ProfileUpdateInput,
  identity?: { firstName: string; lastName: string; organizationName?: string }
) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new NotFoundError("Authenticated user not found.");
  return prisma.$transaction(async (tx) => {
    if (
      data.country?.connect?.id &&
      !(await tx.country.findUnique({ where: { id: data.country.connect.id } }))
    )
      throw new NotFoundError("Country not found.");
    if (identity)
      await tx.user.update({
        where: { id: user.id },
        data: { firstName: identity.firstName, lastName: identity.lastName }
      });
    let organizationId: string | null | undefined;
    if (identity?.organizationName !== undefined) {
      if (!identity.organizationName.trim()) organizationId = null;
      else {
        let org = await tx.organization.findFirst({
          where: { name: identity.organizationName, deletedAt: null }
        });
        if (!org)
          org = await tx.organization.create({
            data: { name: identity.organizationName }
          });
        organizationId = org.id;
      }
    }
    return tx.profile.upsert({
      where: { userId: user.id },
      update: {
        ...data,
        ...(organizationId !== undefined
          ? {
              organization: organizationId
                ? { connect: { id: organizationId } }
                : { disconnect: true }
            }
          : {})
      },
      create: {
        userId: user.id,
        title: typeof data.title === "string" ? data.title : undefined,
        designation: typeof data.designation === "string" ? data.designation : undefined,
        phone: typeof data.phone === "string" ? data.phone : undefined,
        bio: typeof data.bio === "string" ? data.bio : undefined,
        countryId: data.country?.connect?.id,
        organizationId: organizationId ?? undefined
      }
    });
  });
}

export async function assignRole(userId: string, roleName: RoleName) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id }
  });
}

export async function listUsers(options: {
  page: number;
  pageSize: number;
  search?: string;
}) {
  const skip = (options.page - 1) * options.pageSize;
  const where = {
    deletedAt: null,
    ...(options.search
      ? {
          OR: [
            { email: { contains: options.search, mode: "insensitive" as const } },
            { firstName: { contains: options.search, mode: "insensitive" as const } },
            { lastName: { contains: options.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: options.pageSize,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { email: "asc" }
    }),
    prisma.user.count({ where })
  ]);

  return { items, total };
}

export async function softDeleteUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() }
  });
}

export async function restoreUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null }
  });
}

export async function updateUserRole(userId: string, targetRoleName: RoleName) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: targetRoleName } });
  return prisma.$transaction(async (tx) => {
    // Clear existing roles
    await tx.userRole.deleteMany({ where: { userId } });
    // Create new assignment
    return tx.userRole.create({
      data: { userId, roleId: role.id }
    });
  });
}
