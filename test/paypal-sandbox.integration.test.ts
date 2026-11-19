// @vitest-environment node
import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { paypalConfig } from "../lib/paypal/config";
import { paypalRequest } from "../lib/paypal/provider";
import { minorUnits, object } from "../lib/paypal/verification";

// Explicit opt-in; never uses live endpoints or real money. Buyer approval happens
// through the real SDK checkout, not an automated password-based buyer simulation.
describe.skipIf(process.env.PAYPAL_SANDBOX_INTEGRATION !== "true")(
  "real PayPal Sandbox",
  () => {
    it("creates one real order for duplicate requests and fetches its authoritative details", async () => {
      const config = paypalConfig();
      expect(config.PAYPAL_ENV).toBe("sandbox");
      if (config.PAYPAL_ENV !== "sandbox")
        throw new Error("Sandbox tests refuse live credentials.");
      const key = randomUUID(),
        id = randomUUID();
      const body = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: id,
            custom_id: id,
            invoice_id: id,
            payee: { merchant_id: config.PAYPAL_MERCHANT_ID },
            amount: { currency_code: "USD", value: "1.00" }
          }
        ]
      };
      const first = await paypalRequest("/v2/checkout/orders", "POST", body, key);
      const second = await paypalRequest("/v2/checkout/orders", "POST", body, key);
      expect(first.id).toBe(second.id);
      const fetched = await paypalRequest("/v2/checkout/orders/" + first.id);
      const unit = object((fetched.purchase_units as unknown[])[0]);
      expect(unit.custom_id).toBe(id);
      expect(object(unit.payee).merchant_id).toBe(config.PAYPAL_MERCHANT_ID);
      expect(minorUnits(object(unit.amount).value)).toBe(100);
    }, 60_000);
  }
);
