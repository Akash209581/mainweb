import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSubmissionChallenge } from "@/lib/security/submission-challenge";
import { enforceRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { AppError } from "@/lib/errors/app-error";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    enforceRateLimit("submission-challenge:" + getClientIp(await headers()), 30, 60000);
    return NextResponse.json(createSubmissionChallenge(), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError
            ? e.message
            : "Unable to load verification. Please try again."
      },
      { status: e instanceof AppError ? e.statusCode : 503 }
    );
  }
}
