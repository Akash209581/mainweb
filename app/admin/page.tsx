import { cookies } from "next/headers";
import { validSession } from "@/lib/security/admin-session";
import { AdminLogin } from "@/components/security/admin-login";
import { AdminPortal } from "@/components/security/admin-portal";
import { csrfToken } from "@/lib/security/checkout";
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
  const secret = process.env.ADMIN_SESSION_SECRET;
  const isValid = await validSession(token, secret);

  if (!isValid || !token) return <AdminLogin />;
  return <AdminPortal csrf={csrfToken(token)}><Portal email={process.env.ADMIN_EMAIL || "admin@icgit2026.org"} /></AdminPortal>;
}
