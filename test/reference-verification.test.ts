import { describe, expect, it } from "vitest";
import { source as registration } from "../components/approved-reference/registration-source";
import { source as abstracts } from "../components/approved-reference/abstracts-source";
import { validatedReferenceScript } from "../components/approved-reference/validated-script";
describe("reference verification adapters", () => {
  for (const [page, source] of [
    ["registration", registration],
    ["abstracts", abstracts]
  ] as const)
    it("loads signed server challenges for " + page, () => {
      const code = validatedReferenceScript(source.script);
      expect(code).toContain("fetch(challengeEndpoint");
      expect(code).toContain(
        (page === "registration" ? "p" : "payload") +
          ".captchaToken=submissionCaptchaToken"
      );
      expect(code).toContain(
        (page === "registration" ? "p" : "payload") +
          ".captchaAnswer=form.elements.captcha.value"
      );
      expect(() => new Function("document", "fetch", code)).not.toThrow();
    });
});
