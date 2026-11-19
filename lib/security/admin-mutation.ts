import { cookies } from "next/headers";
import { hasAdminSession } from "./admin-access";
import { requireCsrf } from "./checkout";
import { PaymentError } from "@/lib/paypal/config";
export async function requireAdminMutation(request: Request) {
  if (!(await hasAdminSession()))
    throw new PaymentError("Administrator authentication required.", 401);
  requireCsrf(request, (await cookies()).get("admin_session")?.value || "");
}
