import { describe, expect, it } from "vitest";
import { registrationSchema, publicRegistrationSchema } from "../lib/validation/schemas";
import {
  phoneSchema,
  brochureRequestSchema,
  publicAbstractSchema,
  conferenceQuerySchema
} from "../lib/validation/public-inputs";
import { sanitizePhone, attachInputValidation } from "../lib/client/input-validation";
const base = {
  first: "Ana",
  last: "O\u2019Neill",
  email: "ana@example.test",
  phone: "+91 98765 43210",
  institution: "University 21",
  country: "India",
  category: "student",
  currency: "EUR",
  role: "Attendee",
  terms: true
};
describe("public input boundaries", () => {
  it.each(["abc1234567", "+91 123abc4567", "123", "1234567890123456"])(
    "rejects invalid phone %s",
    (v) => expect(phoneSchema.safeParse(v).success).toBe(false)
  );
  it("allows international phone punctuation and Unicode names", () => {
    expect(
      publicRegistrationSchema.safeParse({
        ...base,
        first: "\u00c9lodie",
        last: "\u5f20"
      }).success
    ).toBe(true);
    expect(sanitizePhone(" +91 abc98!765")).toBe("+91 98765");
  });
  it.each([
    { email: "invalid" },
    { first: "Ana123" },
    { first: "Ana\nDoe" },
    { country: "Not a country" },
    { role: "Administrator" },
    { terms: false },
    { rooms: "1e2" },
    { rooms: -1 },
    { rooms: 1.5 },
    { guests: "99" },
    { beds: "Anything" }
  ])("rejects malformed registration fields %j", (change) =>
    expect(publicRegistrationSchema.safeParse({ ...base, ...change }).success).toBe(false)
  );
  it.each([
    { checkin: "2026-02-30", checkout: "2026-03-02" },
    { checkin: "2026-12-10", checkout: "2026-12-09" },
    { checkin: "", checkout: "" }
  ])("rejects invalid accommodation dates %j", (dates) =>
    expect(registrationSchema.safeParse({ ...base, stay: true, ...dates }).success).toBe(
      false
    )
  );
  it("requires conditional invoice and partnership fields", () => {
    expect(registrationSchema.safeParse({ ...base, invoice: true }).success).toBe(false);
    expect(
      publicRegistrationSchema.safeParse({
        ...base,
        category: "sponsorship",
        package: "Gold"
      }).success
    ).toBe(false);
    expect(
      publicRegistrationSchema.safeParse({
        ...base,
        category: "sponsorship",
        package: "Gold",
        representatives: "2"
      }).success
    ).toBe(true);
  });
  it("validates brochure consent, phone and selection", () => {
    const b = { ...base, interest: "Attending the conference", privacy: true };
    expect(brochureRequestSchema.safeParse(b).success).toBe(true);
    expect(brochureRequestSchema.safeParse({ ...b, privacy: false }).success).toBe(false);
    expect(brochureRequestSchema.safeParse({ ...b, interest: "Forged" }).success).toBe(
      false
    );
  });
  it("validates query subject, message and consent", () => {
    const q = {
      name: "Ana Doe",
      email: base.email,
      subject: "Registration",
      message: "Please explain the registration options.",
      privacy: true
    };
    expect(conferenceQuerySchema.safeParse(q).success).toBe(true);
    expect(conferenceQuerySchema.safeParse({ ...q, message: "x" }).success).toBe(false);
    expect(conferenceQuerySchema.safeParse({ ...q, privacy: false }).success).toBe(false);
  });
  it("validates abstract coauthors and declarations", () => {
    const a = {
      ...base,
      title: "A research contribution",
      track: "Other",
      presentation: "Oral presentation",
      authorsConsent: true,
      ethics: true,
      coAuthors: [{ name: "Renee Doe", affiliation: "Institute" }]
    };
    expect(publicAbstractSchema.safeParse(a).success).toBe(true);
    expect(publicAbstractSchema.safeParse({ ...a, ethics: false }).success).toBe(false);
    expect(
      publicAbstractSchema.safeParse({ ...a, coAuthors: [{ name: "", affiliation: "" }] })
        .success
    ).toBe(false);
  });
  it("blocks letters in phone and whole-number controls without affecting names", () => {
    const root = document.createElement("div");
    document.body.append(root);
    const shadow = root.attachShadow({ mode: "open" });
    shadow.innerHTML =
      '<input type="tel"><input type="number" step="1"><input name="first">';
    const detach = attachInputValidation(shadow);
    try {
      const phone = shadow.querySelector("input")!;
      const letter = new KeyboardEvent("keydown", {
        key: "x",
        bubbles: true,
        cancelable: true
      });
      expect(phone.dispatchEvent(letter)).toBe(false);
      const number = shadow.querySelector<HTMLInputElement>("input[type=number]")!;
      expect(
        number.dispatchEvent(
          new KeyboardEvent("keydown", { key: "e", bubbles: true, cancelable: true })
        )
      ).toBe(false);
      expect(
        shadow
          .querySelector("[name=first]")!
          .dispatchEvent(
            new KeyboardEvent("keydown", { key: "A", bubbles: true, cancelable: true })
          )
      ).toBe(true);
    } finally {
      detach();
      root.remove();
    }
  });
});

describe('registration name limits',()=>{it('accepts both name fields at their displayed 80-character limits',()=>{const first='A'.repeat(80),last='B'.repeat(80);expect(publicRegistrationSchema.safeParse({...base,first,last,fullName:first+' '+last}).success).toBe(true)})});
