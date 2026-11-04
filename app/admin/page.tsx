import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Conference Admin",
  description: "Conference administration portal."
};
export default function AdminPage() {
  redirect(process.env.ADMIN_PORTAL_URL || "http://localhost:3005/conference-admin");
}
