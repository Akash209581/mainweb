import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { migrationInventory } from "./paypal-fresh-database";

/** Verify the complete historical object inventory plus SQL-managed payment guards. */
export async function verifyReplayCatalog(
  client: PrismaClient,
  migrations: ReturnType<typeof migrationInventory>,
  run: string
) {
  function require(ok: unknown, message: string): asserts ok {
    if (!ok) throw new Error(message);
  }
  const history = await client.$queryRaw<
    Array<{
      migration_name: string;
      checksum: string;
      finished: boolean;
      rolled_back: boolean;
    }>
  >`
    SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back
    FROM public._prisma_migrations ORDER BY migration_name`;
  require(history.length === migrations.length &&
    history.every(
      (row, i) =>
        row.migration_name === migrations[i].name &&
        row.checksum === migrations[i].checksum &&
        row.finished &&
        !row.rolled_back
    ), "Migration history/checksum verification failed.");
  const tables = await client.$queryRaw<
    Array<{ name: string }>
  >`SELECT tablename AS name FROM pg_tables WHERE schemaname='public'`;
  const indexes = await client.$queryRaw<
    Array<{ name: string; definition: string }>
  >`SELECT indexname AS name, indexdef AS definition FROM pg_indexes WHERE schemaname='public'`;
  const constraints = await client.$queryRaw<
    Array<{ name: string; type: string; definition: string; validated: boolean }>
  >`
    SELECT conname AS name, contype::text AS type, pg_get_constraintdef(c.oid) AS definition, convalidated AS validated
    FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public'`;
  const triggers = await client.$queryRaw<
    Array<{ name: string; definition: string; enabled: string }>
  >`
    SELECT tgname AS name, pg_get_triggerdef(t.oid) AS definition, tgenabled::text AS enabled FROM pg_trigger t
    JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT tgisinternal`;
  const enums = await client.$queryRaw<Array<{ name: string; labels: string[] }>>`
    SELECT t.typname AS name, array_agg(e.enumlabel::text ORDER BY e.enumsortorder) AS labels FROM pg_type t
    JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' GROUP BY t.typname`;
  const functions = await client.$queryRaw<Array<{ name: string; definition: string }>>`
    SELECT p.proname AS name, pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'`;
  const sql = migrations.map((m) => m.sql).join("\n");
  const inventory = [
    { pattern: /CREATE TABLE (?:"public"\.)?"([^"]+)"/g, actual: tables, kind: "table" },
    { pattern: /CREATE (?:UNIQUE )?INDEX "([^"]+)"/g, actual: indexes, kind: "index" },
    { pattern: /CONSTRAINT "([^"]+)"/g, actual: constraints, kind: "constraint" },
    { pattern: /CREATE TRIGGER "([^"]+)"/g, actual: triggers, kind: "trigger" },
    { pattern: /CREATE TYPE (?:"public"\.)?"([^"]+)"/g, actual: enums, kind: "enum" }
  ];
  for (const item of inventory)
    for (const match of sql.matchAll(item.pattern))
      require(item.actual.some(
        (row) => row.name === match[1]
      ), `Missing historical ${item.kind}: ${match[1]}`);
  for (const match of sql.matchAll(
    /CREATE TYPE (?:"public"\.)?"([^"]+)" AS ENUM \(([^;]+)\);/g
  )) {
    const expected = [...match[2].matchAll(/'([^']+)'/g)].map((value) => value[1]);
    for (const added of sql.matchAll(
      new RegExp(`ALTER TYPE "${match[1]}" ADD VALUE '([^']+)'`, "g")
    ))
      expected.push(added[1]);
    require(JSON.stringify(enums.find((row) => row.name === match[1])?.labels) ===
      JSON.stringify(expected), `Enum values mismatch: ${match[1]}`);
  }
  const snapshot = constraints.find(
    (row) => row.name === "Payment_paypal_snapshot_required"
  );
  require(snapshot?.definition.includes("IS TRUE") &&
    snapshot.definition.includes("totalAmountCents") &&
    !snapshot.validated, "Snapshot CHECK definition or intentional NOT VALID status differs.");
  require(indexes
    .find((row) => row.name === "Payment_one_paypal_registration")
    ?.definition.includes("WHERE"), "Missing lifetime partial uniqueness.");
  require(indexes
    .find((row) => row.name === "Payment_paypal_reconciliation")
    ?.definition.includes('("provider", "lastReconciledAt")') ||
    indexes
      .find((row) => row.name === "Payment_paypal_reconciliation")
      ?.definition.includes(
        '(provider, "lastReconciledAt")'
      ), "Reconciliation index columns mismatch.");
  require(triggers.length === 2 &&
    triggers.every(
      (row) => row.enabled === "O"
    ), "Payment/invoice triggers are not enabled.");
  require(functions
    .find((row) => row.name === "protect_paypal_identity")
    ?.definition.includes("NEW.id IS DISTINCT FROM OLD.id") ||
    functions
      .find((row) => row.name === "protect_paypal_identity")
      ?.definition.includes(
        'NEW."id" IS DISTINCT FROM OLD."id"'
      ), "Identity function omits primary key.");
  require(functions.some(
    (row) =>
      row.name === "protect_paypal_invoice_relation" &&
      row.definition.includes("registrationId") &&
      row.definition.includes("amountCents") &&
      row.definition.includes("currency")
  ), "Invoice relation function missing.");
  const namespaces = await client.$queryRaw<
    Array<{ name: string }>
  >`SELECT nspname AS name FROM pg_namespace WHERE nspname NOT IN ('public','information_schema') AND nspname NOT LIKE 'pg_%'`;
  require(namespaces.length === 0, "Unexpected application namespace outside public.");
  const evidence = {
    history,
    tables,
    enums,
    indexes,
    constraints,
    triggers,
    functions,
    namespaces
  };
  writeFileSync(`scratch/${run}-catalog.json`, JSON.stringify(evidence, null, 2));
  console.info(
    "Migration catalog verified:",
    JSON.stringify({
      migrations: history.length,
      tables: tables.length,
      enums: enums.length,
      indexes: indexes.length,
      foreignKeys: constraints.filter((row) => row.type === "f").length,
      triggers: triggers.length
    })
  );
}
