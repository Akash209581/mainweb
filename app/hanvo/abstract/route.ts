import { auth } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/response";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { submitAbstract } from "@/lib/services/abstract.service";
import { abstractSubmissionSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const ipAddress = getClientIp(request.headers);
    enforceRateLimit(`api-abstract:${ipAddress}`, 5, 60_000);
    const input = abstractSubmissionSchema.parse(await request.json());
    const { userId } = await auth();
    const submission = await submitAbstract(input, userId);
    return ok({ id: submission.id, status: submission.status }, 201);
  } catch (error) {
    return fail(error);
  }
}
