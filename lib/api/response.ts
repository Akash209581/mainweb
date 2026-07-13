import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import { formatZodError } from "@/lib/validation/format";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: formatZodError(error) } },
      { status: 400 }
    );
  }

  logger.error("Unexpected API error", {
    metadata: {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }
  });

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "An unexpected error occurred."
      }
    },
    { status: 500 }
  );
}

