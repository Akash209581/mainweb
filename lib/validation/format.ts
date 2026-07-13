import type { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  return error.errors.map((issue) => issue.message).join(" ");
}
