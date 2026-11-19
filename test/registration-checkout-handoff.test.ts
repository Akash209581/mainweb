import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { source } from "../components/approved-reference/registration-source";
import { validatedReferenceScript } from "../components/approved-reference/validated-script";

const fetcher = vi.fn();
let show: ReturnType<typeof vi.fn>;
let recordResult: {
  ok: boolean;
  checkoutRegistrationId?: string;
  isQuoteRequired?: boolean;
  error?: string;
};
beforeEach(() => {
  document.body.innerHTML = source.markup;
  show = vi.fn();
  Object.defineProperty(document.getElementById("info"), "showModal", { value: show });
  document.getElementById("registration")!.scrollIntoView = vi.fn();
  recordResult = { ok: true, checkoutRegistrationId: "saved-id" };
  fetcher.mockReset();
  fetcher.mockImplementation(async (url: string) => {
    if (url === "/api/records")
      return { ok: recordResult.ok, json: async () => recordResult };
    if (url.includes("challenge"))
      return { ok: true, json: async () => ({ a: 2, b: 3, token: "signed-challenge" }) };
    return { ok: false };
  });
  new Function("document", "fetch", validatedReferenceScript(source.script))(
    document,
    fetcher
  );
});
afterEach(() => {
  document.body.innerHTML = "";
});
async function save() {
  const button = document.getElementById("save-registration") as HTMLButtonElement;
  await (button.onclick as unknown as () => Promise<void>)();
  return button;
}
describe("registration checkout handoff", () => {
  it("replaces the setup popup with payment-method guidance and the save/continue action", () => {
    expect(document.getElementById("checkout-info")).toBeNull();
    expect(source.script).not.toContain("Before registration opens");
    expect(document.querySelector(".payment-method-summary")?.textContent).toContain(
      "Stripe Unavailable"
    );
    expect(document.getElementById("save-registration")?.textContent).toContain(
      "Save and choose payment method"
    );
  });
  it("does not open the old saved dialog while checkout navigation is underway", async () => {
    await save();
    expect(show).not.toHaveBeenCalled();
    const request = fetcher.mock.calls.find(([url]) => url === "/api/records")!;
    const payload = JSON.parse(request[1].body.get("payload"));
    expect(payload.captchaToken).toBe("signed-challenge");
  });
  it("keeps quote requests on the saved-request path", async () => {
    recordResult = { ok: true, isQuoteRequired: true };
    (document.querySelector('[data-choose="exhibition"]') as HTMLButtonElement).click();
    expect(document.getElementById("save-registration")?.textContent).toContain(
      "Save quote request"
    );
    await save();
    expect(show).toHaveBeenCalledOnce();
    expect(document.getElementById("info-title")?.textContent).toBe(
      "Quote request saved"
    );
  });
  it("allows retry after a failed save without implying payment or registration success", async () => {
    recordResult = { ok: false, error: "Unable to save. Please try again." };
    const button = await save();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain("Save and choose payment method");
    expect(document.getElementById("info-title")?.textContent).toBe("Unable to save");
  });
});
