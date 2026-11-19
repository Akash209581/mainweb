import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../components/payments/paypal-checkout", () => ({
  PayPalCheckout: ({ statusOnly }: { statusOnly: boolean }) => (
    <p>{statusOnly ? "Existing payment status" : "PayPal payment flow"}</p>
  )
}));
import { PaymentMethodCheckout } from "../components/payments/payment-method-checkout";
let container: HTMLDivElement;
let root: Root;
const fetcher = vi.fn();
const methods = [
  {
    provider: "PAYPAL",
    name: "PayPal",
    available: true,
    description: "International payments"
  },
  {
    provider: "STRIPE",
    name: "Stripe",
    available: false,
    description: "Not available yet"
  }
];
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset();
  fetcher.mockResolvedValue({
    ok: true,
    json: async () => ({
      methods,
      csrfToken: "csrf",
      amountCents: 12500,
      currency: "USD"
    })
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const render = () =>
  act(async () => root.render(<PaymentMethodCheckout registrationId="registration" />));
const button = (text: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === text)!;
describe("payment method selection", () => {
  it("never starts an order while checking an existing payment", async () => {
    const { PayPalCheckout } = await vi.importActual<
      typeof import("../components/payments/paypal-checkout")
    >("../components/payments/paypal-checkout");
    fetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "PENDING",
        csrfToken: "csrf",
        clientId: "public-client"
      })
    });
    await act(async () =>
      root.render(<PayPalCheckout registrationId="registration" statusOnly />)
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("No new payment has been started");
    expect(document.querySelector('script[src*="paypal.com/sdk"]')).toBeNull();
  });
  it("requires explicit selection, disables Stripe and waits for server dispatch before payment", async () => {
    await render();
    const paypal = container.querySelector<HTMLInputElement>('input[value="PAYPAL"]')!;
    const stripe = container.querySelector<HTMLInputElement>('input[value="STRIPE"]')!;
    expect(paypal.checked).toBe(false);
    expect(stripe.disabled).toBe(true);
    expect(button("Continue to payment").disabled).toBe(true);
    expect(container.querySelectorAll("img")).toHaveLength(2);
    expect(container.textContent).toContain("$125.00");
    await act(async () => paypal.click());
    expect(paypal.checked).toBe(true);
    expect(container.textContent).toContain("Selected");
    expect(container.textContent).not.toContain("PayPal payment flow");
    fetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ provider: "PAYPAL" })
    });
    await act(async () => button("Continue to payment").click());
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ provider: "PAYPAL" });
    expect(fetcher.mock.calls[1][1].headers["X-CSRF-Token"]).toBe("csrf");
    expect(container.textContent).toContain("PayPal payment flow");
  });
  it("keeps provider errors on the selection page without implying payment success", async () => {
    await render();
    await act(async () =>
      container.querySelector<HTMLInputElement>('input[value="PAYPAL"]')!.click()
    );
    fetcher.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Selected payment method is unavailable." })
    });
    await act(async () => button("Continue to payment").click());
    expect(container.textContent).toContain("Selected payment method is unavailable.");
    expect(container.textContent).not.toContain("PayPal payment flow");
    expect(button("Continue to payment").disabled).toBe(false);
  });
  it("preserves status-only access when both providers are unavailable", async () => {
    fetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        methods: methods.map((m) => ({ ...m, available: false })),
        csrfToken: "csrf",
        amountCents: 100,
        currency: "USD"
      })
    });
    await render();
    expect(button("Continue to payment").disabled).toBe(true);
    await act(async () => button("Check existing PayPal payment status").click());
    expect(container.textContent).toContain("Existing payment status");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
