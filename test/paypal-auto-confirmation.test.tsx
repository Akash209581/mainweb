import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PayPalCheckout } from "../components/payments/paypal-checkout";

const fetcher = vi.fn();
let container: HTMLDivElement;
let root: Root;
const status = (value: string) => ({
  status: value,
  currency: "EUR",
  amountCents: 39900,
  csrfToken: "csrf",
  clientId: "test-client"
});
const response = (value: string) => ({ ok: true, json: async () => status(value) });
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset();
  fetcher.mockResolvedValue(response("PROCESSING"));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const render = () =>
  act(async () => root.render(<PayPalCheckout registrationId="test-registration" />));
const tick = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("automatic payment confirmation", () => {
  it("updates processing to verified success without a click and stops polling", async () => {
    await render();
    expect(container.textContent).not.toContain("Payment successful");
    fetcher.mockResolvedValue(response("PAID"));
    await tick(5000);
    expect(container.textContent).toContain("Payment successful");
    expect(container.textContent).toContain("Your registration is confirmed");
    expect(container.querySelector("button")).toBeNull();
    expect(
      fetcher.mock.calls.every(([, init]) => !init.method || init.method === "GET")
    ).toBe(true);
    const calls = fetcher.mock.calls.length;
    await tick(60000);
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it("never reports success while seller acceptance is pending", async () => {
    await render();
    await tick(25000);
    expect(container.textContent).not.toContain("Payment successful");
    expect(container.textContent).toContain("update automatically");
    expect(fetcher.mock.calls.every(([, init]) => !init.method)).toBe(true);
  });
  it("backs off after a status error, then confirms only a verified paid response", async () => {
    await render();
    fetcher.mockRejectedValueOnce(new Error("Database unavailable"));
    await tick(5000);
    expect(container.textContent).not.toContain("Payment successful");
    expect(container.textContent).toContain("check again automatically");
    fetcher.mockResolvedValue(response("PAID"));
    await tick(29999);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await tick(1);
    expect(container.textContent).toContain("Payment successful");
  });
  it("checks immediately when the user returns from the seller dashboard", async () => {
    await render();
    fetcher.mockResolvedValue(response("PAID"));
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(container.textContent).toContain("Payment successful");
  });
  it("aborts status requests and removes timers on navigation", async () => {
    await render();
    const signal = fetcher.mock.calls[0][1].signal as AbortSignal;
    await act(async () => root.render(<div>Another page</div>));
    expect(signal.aborted).toBe(true);
    const calls = fetcher.mock.calls.length;
    await tick(60000);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it("stops on failure without displaying a success message", async () => {
    await render();
    fetcher.mockResolvedValue(response("FAILED"));
    await tick(5000);
    expect(container.textContent).toContain("Payment status: FAILED");
    expect(container.textContent).not.toContain("Payment successful");
    const calls = fetcher.mock.calls.length;
    await tick(60000);
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it("captures once after buyer approval and only reads status afterward", async () => {
    let approve!: () => Promise<void>;
    vi.stubGlobal("paypal", {
      Buttons: (options: Record<string, unknown>) => {
        approve = options.onApprove as () => Promise<void>;
        return { render: async () => {}, close: async () => {} };
      }
    });
    fetcher.mockResolvedValueOnce(response("PENDING"));
    await render();
    await act(async () => {
      await approve();
    });
    expect(fetcher.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(
      1
    );
    fetcher.mockResolvedValue(response("PAID"));
    await tick(5000);
    expect(container.textContent).toContain("Payment successful");
    expect(fetcher.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(
      1
    );
  });
  it("does not overlap status requests while a previous check is in flight", async () => {
    await render();
    let resolve!: (value: ReturnType<typeof response>) => void;
    fetcher.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    await tick(5000);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await tick(60000);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolve(response("PAID"));
    });
    expect(container.textContent).toContain("Payment successful");
  });
  it("reconciles an uncertain capture using GET without repeating the capture", async () => {
    let approve!: () => Promise<void>;
    vi.stubGlobal("paypal", {
      Buttons: (options: Record<string, unknown>) => {
        approve = options.onApprove as () => Promise<void>;
        return { render: async () => {}, close: async () => {} };
      }
    });
    fetcher.mockResolvedValueOnce(response("PENDING"));
    await render();
    fetcher.mockRejectedValueOnce(new Error("Capture response lost"));
    await act(async () => {
      await approve();
    });
    expect(container.textContent).not.toContain("Payment successful");
    fetcher.mockResolvedValue(response("PAID"));
    await tick(5000);
    expect(container.textContent).toContain("Payment successful");
    expect(fetcher.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(
      1
    );
  });
});
