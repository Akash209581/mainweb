import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSubmissionChallenge,
  verifySubmissionChallenge
} from "../lib/security/submission-challenge";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe("server submission verification", () => {
  const setup = () =>
    vi.stubEnv("ADMIN_SESSION_SECRET", "validation-test-secret-".repeat(3));
  it("checks answers and rejects reuse", () => {
    setup();
    const c = createSubmissionChallenge();
    expect(() => verifySubmissionChallenge(c.token, "99")).toThrow(/incorrect/);
    expect(() => verifySubmissionChallenge(c.token, String(c.a + c.b))).not.toThrow();
    expect(() => verifySubmissionChallenge(c.token, String(c.a + c.b))).toThrow(
      /already used/
    );
  });
  it("rejects modified and expired tokens", () => {
    setup();
    const c = createSubmissionChallenge();
    expect(() => verifySubmissionChallenge(c.token + "0", String(c.a + c.b))).toThrow();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 31 * 60000);
    expect(() => verifySubmissionChallenge(c.token, String(c.a + c.b))).toThrow(
      /expired/
    );
  });
  it("fails closed without a signing secret", () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "");
    expect(() => createSubmissionChallenge()).toThrow(/not configured/);
  });
});
