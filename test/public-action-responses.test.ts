import { beforeEach, describe, expect, it, vi } from "vitest";
const { register, contact, abstract, verify } = vi.hoisted(() => ({
  register: vi.fn(),
  contact: vi.fn(),
  abstract: vi.fn(),
  verify: vi.fn()
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  getClientIp: () => "test"
}));
vi.mock("@/lib/security/submission-challenge", () => ({
  verifySubmissionChallenge: verify
}));
vi.mock("@/lib/services/registration.service", () => ({ submitRegistration: register }));
vi.mock("@/lib/services/contact.service", () => ({ submitContactMessage: contact }));
vi.mock("@/lib/services/public-abstract.service", () => ({
  savePublicAbstract: abstract
}));
vi.mock("@/lib/prisma/client", () => ({ prisma: {} }));
vi.mock("@/lib/logging/logger", () => ({ logger: { error: vi.fn() } }));
import { submitHansciRegistrationAction } from "../actions/registration.actions";
import {
  submitBrochureRequestAction,
  submitConferenceQueryAction
} from "../actions/contact.actions";
import { submitHansciAbstractAction } from "../actions/abstract.actions";
const base = {
  first: "Ana",
  last: "Doe",
  email: "ana@example.test",
  phone: "+919876543210",
  institution: "University",
  country: "India",
  category: "student",
  currency: "EUR",
  role: "Attendee",
  terms: true
};
describe("public action responses", () => {
  beforeEach(() => {
    register.mockReset();
    contact.mockReset();
    abstract.mockReset();
    verify.mockReset();
  });
  it("rejects malformed registration before persistence", async () => {
    const r = await submitHansciRegistrationAction({ ...base, phone: "letters" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });
  it("returns failure when registration database save fails", async () => {
    register.mockRejectedValue(new Error("offline"));
    const r = await submitHansciRegistrationAction(base);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(503);
  });
  it("returns the saved registration reference and server total", async () => {
    register.mockResolvedValue({
      id: "r",
      referenceNumber: "R-1",
      totalAmountCents: 32123,
      isQuoteRequired: false
    });
    const r = await submitHansciRegistrationAction(base);
    expect(r).toMatchObject({
      ok: true,
      referenceNumber: "R-1",
      totalAmountCents: 32123
    });
  });
  it("rejects invalid brochure and query payloads before persistence", async () => {
    expect(
      (
        await submitBrochureRequestAction({
          ...base,
          phone: "abc",
          interest: "Attending the conference",
          privacy: true
        })
      ).ok
    ).toBe(false);
    expect(
      (
        await submitConferenceQueryAction({
          name: "Ana Doe",
          email: "bad",
          subject: "Other",
          message: "Please explain this request.",
          privacy: true
        })
      ).ok
    ).toBe(false);
    expect(contact).not.toHaveBeenCalled();
  });
  it("reports failed brochure/query database writes", async () => {
    contact.mockRejectedValue(new Error("offline"));
    const b = await submitBrochureRequestAction({
      ...base,
      interest: "Attending the conference",
      privacy: true
    });
    const q = await submitConferenceQueryAction({
      name: "Ana Doe",
      email: base.email,
      subject: "Other",
      message: "Please explain the conference details.",
      privacy: true
    });
    expect(b).toMatchObject({ ok: false, status: 503 });
    expect(q).toMatchObject({ ok: false, status: 503 });
  });
  it("preserves brochure fields and consent in the stored message", async () => {
    contact.mockResolvedValue({ id: "saved" });
    expect(
      (
        await submitBrochureRequestAction({
          ...base,
          interest: "Attending the conference",
          privacy: true,
          updates: true
        })
      ).ok
    ).toBe(true);
    expect(contact.mock.calls[0][0].message).toContain(base.phone);
    expect(contact.mock.calls[0][0].message).toContain("Receive updates: Yes");
    expect(contact.mock.calls[0][0].message).toContain(
      "Privacy notice acknowledged: Yes"
    );
  });
  it("reports failed abstract persistence", async () => {
    abstract.mockRejectedValue(new Error("offline"));
    expect(await submitHansciAbstractAction({}, undefined)).toMatchObject({
      ok: false,
      status: 503
    });
  });
});
