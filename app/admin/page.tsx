// @ts-expect-error Untyped JSX component from admin portal
import Portal from "@/hansci-novum-admin-portal/app/admin/portal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Portal — ICGIT 2026",
  description: "Unified conference operations, records, and content settings."
};

export default function AdminPage() {
  return <Portal email="admin@icgit2026.org" />;
}
