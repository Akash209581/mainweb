import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/security/admin-session";
import { csrfToken, limitRequests, readJson, requireCsrf } from "@/lib/security/checkout";
import { requireAdminMutation } from "@/lib/security/admin-mutation";
import { PaymentError } from "@/lib/paypal/config";
import { prisma } from "@/lib/prisma/client";
export const runtime = "nodejs";
const schema = z
  .object({ email: z.string().email().max(180), password: z.string().min(1).max(256) })
  .strict();
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/ICGIT",
  maxAge: 600
};
export async function GET() {
  const token = randomBytes(32).toString("hex");
  const response = NextResponse.json(
    { csrfToken: csrfToken(token) },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set("admin_login_csrf", token, options);
  return response;
}
export async function POST(request: Request) {
  try {
    requireCsrf(request, (await cookies()).get("admin_login_csrf")?.value || "");
    // Global account bucket cannot be bypassed through spoofed forwarding headers.
    await limitRequests("administrator-login", 5, 15 * 60_000);
    const secret = process.env.ADMIN_SESSION_SECRET;
    const email = process.env.ADMIN_EMAIL;
    const stored = process.env.ADMIN_PASSWORD_HASH;
    if (!secret || secret.length < 32 || !email || !stored)
      throw new PaymentError("Administrator login is not configured.", 503);
    const data = schema.parse(await readJson(request));
    const [scheme, salt, hash, extra] = stored.split("$");
    if (
      extra ||
      scheme !== "scrypt" ||
      !/^[a-f0-9]{32}$/.test(salt || "") ||
      !/^[a-f0-9]{128}$/.test(hash || "")
    )
      throw new PaymentError("Administrator login is not configured.", 503);
    const valid = timingSafeEqual(
      scryptSync(data.password, salt, 64),
      Buffer.from(hash, "hex")
    );
    if (!valid || data.email.toLowerCase() !== email.toLowerCase()) {
      await prisma.auditLog.create({
        data: { action: "admin.login.failed", entity: "AdminSession" }
      });
      throw new PaymentError("Invalid administrator credentials.", 401);
    }
    await prisma.auditLog.create({
      data: { action: "admin.login.succeeded", entity: "AdminSession" }
    });
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
    response.cookies.set("admin_session", await createSession(secret), {
      ...options,
      maxAge: 8 * 3600
    });
    response.cookies.set("admin_login_csrf", "", { ...options, maxAge: 0 });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof PaymentError
            ? error.message
            : error instanceof z.ZodError
              ? "Invalid login request."
              : "Administrator sign in is temporarily unavailable."
      },
      {
        status:
          error instanceof PaymentError
            ? error.status
            : error instanceof z.ZodError
              ? 400
              : 503
      }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    await requireAdminMutation(request);
    await prisma.auditLog.create({
      data: { action: "admin.logout", entity: "AdminSession" }
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin_session", "", { ...options, maxAge: 0 });
    // Also expire the previous root-scoped cookie, if present.
    response.headers.append(
      "Set-Cookie",
      "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict" +
        (process.env.NODE_ENV === "production" ? "; Secure" : "")
    );
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid logout request." }, { status: 403 });
  }
}
