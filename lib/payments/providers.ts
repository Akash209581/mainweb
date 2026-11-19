import { paypalConfig } from "@/lib/paypal/config";

export type CheckoutProvider = "PAYPAL" | "STRIPE";
export type PaymentMethod = {
  provider: CheckoutProvider;
  name: string;
  available: boolean;
  description: string;
};

// Server-only availability. Never return credentials or infer Stripe readiness
// from a key: a verified Stripe integration has not been implemented.
export function paymentMethods(): PaymentMethod[] {
  let paypalAvailable = false;
  try {
    const config = paypalConfig();
    paypalAvailable =
      config.PAYPAL_ENABLED === "true" || config.PAYPAL_CAPTURE_ENABLED === "true";
  } catch {
    /* Invalid or unapproved configuration stays unavailable. */
  }
  return [
    {
      provider: "PAYPAL",
      name: "PayPal",
      available: paypalAvailable,
      description: paypalAvailable
        ? "For eligible international customers. Indian domestic payments are not supported."
        : "PayPal checkout is currently unavailable."
    },
    {
      provider: "STRIPE",
      name: "Stripe",
      available: false,
      description: "Stripe is not available yet. Please use an available payment method."
    }
  ];
}
