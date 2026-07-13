import type { Prisma, RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export async function findUserByClerkId(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      profile: { include: { organization: true } },
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
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
    include: { profile: { include: { organization: true } }, roles: { include: { role: true } } }
  });
}

export async function updateUserProfile(
  clerkUserId: string,
  data: Prisma.ProfileUpdateInput & {
    user?: Prisma.UserUpdateOneRequiredWithoutProfileNestedInput;
  }
) {
  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    return null;
  }

  return prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: {
      userId: user.id,
      title: typeof data.title === "string" ? data.title : undefined,
      designation: typeof data.designation === "string" ? data.designation : undefined,
      phone: typeof data.phone === "string" ? data.phone : undefined,
      bio: typeof data.bio === "string" ? data.bio : undefined
    }
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

