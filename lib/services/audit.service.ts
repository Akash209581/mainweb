import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

export async function writeAuditLog(input: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}
