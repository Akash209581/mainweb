// @vitest-environment node
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertMigrationChainIsolated,
  assertMigrationSchemaTargets
} from "./helpers/paypal-migration-isolation";
const schema = "paypal_test_" + "a".repeat(32);
describe("historical migration namespace preflight", () => {
  it("blocks this repository's public-qualified history before database access", () => {
    expect(() =>
      assertMigrationChainIsolated(path.resolve("prisma/migrations"), schema)
    ).toThrow("20260703000100_initial_enterprise_schema");
  });
  it("rejects explicit schema creation", () =>
    expect(() =>
      assertMigrationSchemaTargets(
        'CREATE SCHEMA IF NOT EXISTS "public";',
        schema,
        "test"
      )
    ).toThrow());
  it("rejects quoted external table targets", () =>
    expect(() =>
      assertMigrationSchemaTargets(
        'CREATE TABLE "public"."Payment" (id text);',
        schema,
        "test"
      )
    ).toThrow());
  it("rejects unquoted external enum targets", () =>
    expect(() =>
      assertMigrationSchemaTargets(
        "ALTER TYPE public.PaymentStatus ADD VALUE 'PAID';",
        schema,
        "test"
      )
    ).toThrow());
  it("rejects search-path changes", () =>
    expect(() =>
      assertMigrationSchemaTargets("SET LOCAL search_path = public;", schema, "test")
    ).toThrow());
  it("permits unqualified DDL and explicitly matching generated namespaces", () =>
    expect(() =>
      assertMigrationSchemaTargets(
        'CREATE TABLE "Payment" (id text); CREATE TABLE "' +
          schema +
          '"."Other" (id text);',
        schema,
        "test"
      )
    ).not.toThrow());
});
