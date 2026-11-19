import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { PaymentError } from "@/lib/paypal/config";
import { ownedRegistration } from "@/lib/paypal/service";
import { paymentMethods } from "@/lib/payments/providers";
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
type Context = { params: Promise<{ registrationId: string }> };
const bodySchema = z.object({ provider: z.enum(["PAYPAL", "STRIPE"]) }).strict();
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function failure(error: unknown) {
  return reply(
    {
      error:
        error instanceof PaymentError
          ? error.message
          : error instanceof ZodError
            ? "Invalid payment method request."
            : "Checkout is temporarily unavailable. Please try again."
    },
    error instanceof PaymentError ? error.status : error instanceof ZodError ? 400 : 503
  );
}
export async function GET(_request: Request, context: Context) {
  try {
    const capability = await guestCapability();
    await limitRequests("methods:" + hashCapability(capability), 30);
    const registration = await ownedRegistration(
      z
        .string()
        .uuid()
        .parse((await context.params).registrationId),
      capability
    );
    return reply({
      methods: paymentMethods(),
      csrfToken: csrfToken(capability),
      amountCents: registration.totalAmountCents,
      currency: registration.currency
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const capability = await guestCapability();
    requireCsrf(request, capability);
    await limitRequests("method-select:" + hashCapability(capability), 10);
    const id = z
      .string()
      .uuid()
      .parse((await context.params).registrationId);
    const body = bodySchema.parse(await readJson(request));
    await ownedRegistration(id, capability);
    const method = paymentMethods().find((item) => item.provider === body.provider);
    if (!method?.available)
      throw new PaymentError("Selected payment method is unavailable.", 503);
    // The allowlisted dispatch is not a financial state change. PayPal's separate
    // create/capture handlers still enforce ownership, flags and server pricing.
    if (body.provider === "PAYPAL") return reply({ provider: "PAYPAL" });
    throw new PaymentError("Selected payment method is unavailable.", 503);
  } catch (error) {
    return failure(error);
  }
}
