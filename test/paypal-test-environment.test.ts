// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isolatedTestDatabaseUrl } from "./helpers/paypal-test-database";
const schema = "paypal_test_" + "a".repeat(32);
describe("disposable database safety boundary", () => {
  it("requires an explicit URL without fallback", () =>
    expect(() => isolatedTestDatabaseUrl(undefined, schema)).toThrow());
  for (const url of [
    "postgresql://localhost/conference",
    "postgresql://remote.example/conference_test",
    "https://localhost/conference_test",
    "postgresql://localhost/conference_test?options=-csearch_path%3Dpublic",
    "postgresql://localhost/conference_test?host=production.example",
    "invalid"
  ])
    it("rejects an unsafe or unrecognized target", () =>
      expect(() => isolatedTestDatabaseUrl(url, schema)).toThrow());
  it("rejects the application's database even when its name ends _test", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      expect(() =>
        isolatedTestDatabaseUrl(`postgresql://${host}:5432/conference_test`, schema, [
          "postgresql://localhost/conference_test?schema=public"
        ])
      ).toThrow();
    }
    expect(() =>
      isolatedTestDatabaseUrl("postgresql://localhost:5432/conference_test", schema, [
        "postgresql://localhost/conference_test?schema=public"
      ])
    ).toThrow();
  });
  it("always replaces a caller-supplied schema with the isolated identifier", () =>
    expect(
      new URL(
        isolatedTestDatabaseUrl(
          "postgresql://localhost/conference_test?schema=public",
          schema
        )
      ).searchParams.get("schema")
    ).toBe(schema));
});
