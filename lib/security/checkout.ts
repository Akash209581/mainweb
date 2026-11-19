import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { PaymentError } from "@/lib/paypal/config";

export const GUEST_COOKIE = "conference_checkout";
export function hashCapability(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function csrfToken(token: string) {
  return hashCapability("csrf:" + token);
}
export function equalToken(a: string, b: string) {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function requireOrigin(request: Request) {
  const expected = process.env.PUBLIC_APP_ORIGIN;
  if (
    !expected ||
    new URL(expected).origin !== expected ||
    request.headers.get("origin") !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new PaymentError("Invalid request origin.", 403);
}
export function requireCsrf(request: Request, token: string) {
  requireOrigin(request);
  if (!token || !equalToken(request.headers.get("x-csrf-token") || "", csrfToken(token)))
    throw new PaymentError("Invalid request verification.", 403);
}
export async function guestCapability(create = false) {
  const jar = await cookies();
  let token = jar.get(GUEST_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) throw new PaymentError("Checkout ownership is required.", 401);
    token = randomBytes(32).toString("hex");
    jar.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/ICGIT",
      maxAge: 7 * 86400
    });
  }
  return token;
}
export async function limitRequests(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const bucket = hashCapability(key + ":" + Math.floor(now / windowMs));
  const row = await prisma.requestBucket.upsert({
    where: { key: bucket },
    create: { key: bucket, count: 1, expiresAt: new Date(now + windowMs * 2) },
    update: { count: { increment: 1 } }
  });
  if (row.count > limit) throw new PaymentError("Too many requests. Please wait.", 429);
}
export async function readBody(request: Request, maxBytes: number): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new PaymentError("Missing request body.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new PaymentError("Request too large.", 413);
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    throw new PaymentError("Invalid request body.", 400);
  }
}
export async function readJson(request: Request, maxBytes = 4096): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new PaymentError("JSON required.", 415);
  const body = await readBody(request, maxBytes);
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    throw new PaymentError("Invalid JSON.", 400);
  }
}
