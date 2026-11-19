import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/** Conservative preflight for this repository, not a general PostgreSQL parser.
 * A generated Prisma schema cannot redirect explicitly qualified historical SQL.
 * Always require a separately proven disposable instance as well. */
export function assertMigrationSchemaTargets(sql: string, schema: string, name: string) {
  if (!/^paypal_test_[a-f0-9]{32}$/.test(schema))
    throw new Error("Invalid generated test schema.");
  if (
    /\b(?:CREATE|ALTER|DROP)\s+SCHEMA\b/i.test(sql) ||
    /\bSET\s+(?:LOCAL\s+)?search_path\b/i.test(sql)
  )
    throw new Error(
      `Migration ${name} explicitly manages a schema/search path; random-schema replay is blocked before connecting.`
    );
  const qualified =
    /\b(?:TABLE|TYPE|REFERENCES|SEQUENCE|INDEX|FUNCTION|VIEW|ON|FROM|JOIN)\s+(?:(?:IF\s+NOT\s+EXISTS|IF\s+EXISTS|ONLY)\s+)?(?:"([^"]+)"|([a-z_][a-z0-9_]*))\s*\./gi;
  for (const match of sql.matchAll(qualified)) {
    if ((match[1] || match[2]) !== schema)
      throw new Error(
        `Migration ${name} targets a namespace outside the generated test schema; replay is blocked before connecting.`
      );
  }
}
export function assertMigrationChainIsolated(directory: string, schema: string) {
  const names = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of names)
    assertMigrationSchemaTargets(
      readFileSync(path.join(directory, name, "migration.sql"), "utf8"),
      schema,
      name
    );
}
