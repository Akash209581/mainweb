import { cookies, headers } from "next/headers";
import { validSession } from "./admin-session";
export async function hasAdminSession() {
  if (
    !(await validSession(
      (await cookies()).get("admin_session")?.value,
      process.env.ADMIN_SESSION_SECRET
    ))
  )
    return false;
  const h = await headers(),
    origin = h.get("origin");
  if (origin) {
    const expected =
      process.env.PUBLIC_APP_ORIGIN ||
      (h.get("x-forwarded-proto") || "http") + "://" + h.get("host");
    if (origin !== expected) return false;
  }
  return true;
}
