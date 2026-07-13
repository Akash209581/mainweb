import { auth } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/response";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors/app-error";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/prisma/client";
import { findUserByClerkId } from "@/lib/repositories/user.repository";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-delete-abstract:${ipAddress}`, 10, 60_000);

    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await findUserByClerkId(userId);
    if (!user) {
      throw new AuthenticationError();
    }

    const { id } = await context.params;
    const submission = await prisma.abstractSubmission.findUnique({
      where: { id },
      include: { author: true }
    });
    if (!submission || submission.deletedAt) {
      throw new NotFoundError("Abstract submission not found.");
    }

    const isOwner = submission.authorId === user.id;
    const canManage = user.roles.some((entry) =>
      ["ADMIN", "SUPER_ADMIN"].includes(entry.role.name)
    );
    if (!isOwner && !canManage) {
      throw new AuthorizationError();
    }

    await prisma.abstractSubmission.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}

