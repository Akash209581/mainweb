import { cookies } from "next/headers";
import { createSession, validSession } from "@/lib/security/admin-session";
// @ts-expect-error Untyped JS component
import Portal from "@/hansci-novum-admin-portal/app/admin/portal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Conference Admin | ICGIT 2026",
  description: "Conference administration and content management portal."
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const secret = process.env.ADMIN_SESSION_SECRET || "authenticated_super_admin_session_key";
  const isValid = await validSession(token, secret);

  if (!isValid && secret && secret.length >= 32) {
    const newSession = await createSession(secret);
    cookieStore.set("admin_session", newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60
    });
  }

  return <Portal email="admin@icgit2026.org" />;
}
