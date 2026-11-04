import { beforeEach, describe, expect, it, vi } from "vitest";
const { pricing, create, transaction } = vi.hoisted(() => {
  const pricing = vi.fn(),
    create = vi.fn();
  const tx = {
    conference: { findUnique: vi.fn().mockResolvedValue({ id: "conference-id" }) },
    registration: { create },
    auditLog: { create: vi.fn().mockResolvedValue({}) }
  };
  return { pricing, create, transaction: vi.fn((fn: any) => fn(tx)) };
});
vi.mock("@/lib/prisma/client", () => ({
  prisma: { systemSetting: { findFirst: pricing }, $transaction: transaction }
}));
import { createRegistration } from "../lib/repositories/write.repository";
import { registrationSchema } from "../lib/validation/schemas";
describe("registration server pricing", () => {
  beforeEach(() => {
    pricing.mockReset();
    create.mockReset();
    create.mockImplementation(async ({ data }) => ({ id: "registration-id", ...data }));
  });
  const input = (extra: Record<string, unknown> = {}) =>
    registrationSchema.parse({
      first: "QA",
      last: "Participant",
      email: "qa@example.test",
      phone: "+911234567890",
      category: "student",
      currency: "EUR",
      terms: true,
      ...extra
    });
  it("uses saved admin prices and rounds decimal cents independently of client totals", async () => {
    pricing.mockResolvedValue({
      value: { student: { EUR: 321.23 }, accommodation: { single: { EUR: 87.5 } } }
    });
    const r = await createRegistration(
      input({
        stay: true,
        checkin: "2026-12-08",
        checkout: "2026-12-10",
        room: "single",
        rooms: 2,
        totalAmountCents: 1
      })
    );
    expect(r.registrationFeeCents).toBe(32123);
    expect(r.accommodationFeeCents).toBe(35000);
    expect(r.totalAmountCents).toBe(67123);
    expect(r.phone).toBe("+911234567890");
  });
  it("preserves a configured zero accommodation rate", async () => {
    pricing.mockResolvedValue({
      value: { student: { EUR: 100 }, accommodation: { single: { EUR: 0 } } }
    });
    const r = await createRegistration(
      input({ stay: true, checkin: "2026-12-08", checkout: "2026-12-10" })
    );
    expect(r.accommodationFeeCents).toBe(0);
    expect(r.totalAmountCents).toBe(10000);
  });
  it("retains existing default rates when no saved price exists", async () => {
    pricing.mockResolvedValue(null);
    const r = await createRegistration(input());
    expect(r.registrationFeeCents).toBe(19900);
    expect(r.totalAmountCents).toBe(19900);
  });
});
