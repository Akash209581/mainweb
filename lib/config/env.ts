import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_PROVIDER: z.enum(["local", "s3", "cloudinary"]).default("local"),
  LOCAL_STORAGE_PATH: z.string().default("./storage")
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsedEnv: ServerEnv | null = null;

if (typeof window === "undefined") {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Invalid environment configuration: ${errorDetails}`);
  }
  parsedEnv = result.data;
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv cannot be called on the client side.");
  }
  if (!parsedEnv) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(`Invalid environment configuration: ${result.error.message}`);
    }
    parsedEnv = result.data;
  }
  return parsedEnv;
}

export function getPublicAppUrl(): string {
  return parsedEnv?.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

