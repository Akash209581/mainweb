import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { paypalConfig, PaymentError } from "@/lib/paypal/config";
import { captureOrder, createOrder, statusPayment } from "@/lib/paypal/service";
import {
  csrfToken,
  guestCapability,
  hashCapability,
  limitRequests,
  readJson,
  requireCsrf
} from "@/lib/security/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const idSchema = z.string().uuid();
const bodySchema = z
  .object({
    action: z.enum(["create", "capture"]),
    provider: z.literal("PAYPAL").default("PAYPAL")
  })
  .strict();
type Context = { params: Promise<{ registrationId: string }> };
function safeError(error: unknown) {
  const status =
    error instanceof PaymentError ? error.status : error instanceof ZodError ? 400 : 503;
  return NextResponse.json(
    {
      error:
        error instanceof PaymentError
          ? error.message
          : status === 400
            ? "Invalid checkout request."
            : "Checkout is temporarily unavailable. Check status before retrying."
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
export async function GET(_request: Request, context: Context) {
  try {
    const c = paypalConfig();
    const id = idSchema.parse((await context.params).registrationId);
    const capability = await guestCapability();
    await limitRequests("status:" + hashCapability(capability), 30);
    const status = await statusPayment(id, capability);
    return NextResponse.json(
      { ...status, csrfToken: csrfToken(capability), clientId: c.PAYPAL_CLIENT_ID },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return safeError(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    paypalConfig();
    const capability = await guestCapability();
    requireCsrf(request, capability);
    await limitRequests("checkout:" + hashCapability(capability), 10);
    const id = idSchema.parse((await context.params).registrationId);
    const body = bodySchema.parse(await readJson(request));
    paypalConfig(body.action === "create" ? "create" : "capture");
    const result =
      body.action === "create"
        ? await createOrder(id, capability)
        : await captureOrder(id, capability);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeError(error);
  }
}
