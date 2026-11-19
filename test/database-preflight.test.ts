import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  migrationEnvironment,
  historySafe
} = require("../scripts/database-preflight.cjs");

describe("server migration target protection", () => {
  it("binds migration direct access to the app database", () => {
    const app = "postgresql://app:example@postgres:5432/conferences";
    const env = migrationEnvironment({
      DATABASE_URL: app,
      DIRECT_URL: "postgresql://other:example@elsewhere/other"
    });
    expect(env.DATABASE_URL).toBe(app);
    expect(env.DIRECT_URL).toBe(app);
  });
  it("refuses fallback targets and other schemas", () => {
    expect(() =>
      migrationEnvironment({ DIRECT_URL: "postgresql://localhost/other" })
    ).toThrow("DATABASE_URL is required");
    expect(() =>
      migrationEnvironment({ DATABASE_URL: "postgresql://localhost/app?schema=other" })
    ).toThrow("public schema");
  });
  it("requires baseline review for an existing untracked database", () => {
    expect(() => historySafe([], [], 4)).toThrow("Baseline review");
    expect(() => historySafe([], [], 0)).not.toThrow();
  });
  it("rejects incomplete, unknown, or changed migration history", () => {
    const source = [{ name: "initial", checksum: "expected" }];
    const row = {
      migration_name: "initial",
      checksum: "expected",
      finished_at: new Date(),
      rolled_back_at: null
    };
    expect(() => historySafe([row], source, 4)).not.toThrow();
    for (const change of [
      { finished_at: null },
      { rolled_back_at: new Date() },
      { checksum: "changed" },
      { migration_name: "unknown" }
    ]) {
      expect(() => historySafe([{ ...row, ...change }], source, 4)).toThrow(
        "requires review"
      );
    }
  });
});
