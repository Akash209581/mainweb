import { z } from "zod";

export const paypalConfigSchema = z.object({
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYPAL_ENABLED: z.enum(["true", "false"]).default("false"),
  PAYPAL_CAPTURE_ENABLED: z.enum(["true", "false"]).default("false"),
  PAYPAL_WEBHOOK_ENABLED: z.enum(["true", "false"]).default("true"),
  PAYPAL_RECONCILIATION_ENABLED: z.enum(["true", "false"]).default("true"),
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_MERCHANT_ID: z.string().regex(/^[A-Z0-9]{8,30}$/),
  PAYPAL_WEBHOOK_ID: z.string().min(1),
  PUBLIC_APP_ORIGIN: z
    .string()
    .url()
    .refine((value) => new URL(value).origin === value),
  PAYPAL_LIVE_APPROVED: z.string().optional()
});
export type PaypalOperation = "create" | "capture" | "webhook" | "reconcile";
export function paypalConfig(operation?: PaypalOperation) {
  const parsed = paypalConfigSchema.safeParse(process.env);
  if (!parsed.success) throw new PaymentError("Checkout is unavailable.", 503);
  const c = parsed.data;
  if (c.PAYPAL_ENV === "live" && c.PAYPAL_LIVE_APPROVED !== "true")
    throw new PaymentError("Live checkout is not enabled.", 503);
  if (c.PAYPAL_ENV === "live" && !c.PUBLIC_APP_ORIGIN.startsWith("https://"))
    throw new PaymentError("Live checkout requires HTTPS.", 503);
  const flags = {
    create: c.PAYPAL_ENABLED,
    capture: c.PAYPAL_CAPTURE_ENABLED,
    webhook: c.PAYPAL_WEBHOOK_ENABLED,
    reconcile: c.PAYPAL_RECONCILIATION_ENABLED
  };
  if (operation && flags[operation] !== "true")
    throw new PaymentError(
      operation === "create"
        ? "New checkout is paused."
        : operation === "capture"
          ? "Payment capture is paused. Check payment status or contact support."
          : "Payment processing is paused; retry later.",
      503
    );
  return {
    ...c,
    baseUrl:
      c.PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com"
  };
}
export class PaymentError extends Error {
  constructor(
    message: string,
    public status = 409
  ) {
    super(message);
  }
}
