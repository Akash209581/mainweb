// Read-only by default. --apply runs the reviewed migration chain on DATABASE_URL.
const { PrismaClient } = require("@prisma/client");
const { readFileSync, readdirSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

function migrationEnvironment(env) {
  if (!env.DATABASE_URL)
    throw Error("DATABASE_URL is required; no fallback database is allowed.");
  const url = new URL(env.DATABASE_URL);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    (url.searchParams.get("schema") || "public") !== "public"
  )
    throw Error("Expected the application PostgreSQL public schema.");
  // Prisma migrate normally prefers DIRECT_URL. Bind both to the application target.
  return { ...env, DATABASE_URL: env.DATABASE_URL, DIRECT_URL: env.DATABASE_URL };
}
function inventory() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({
      name: e.name,
      checksum: createHash("sha256")
        .update(readFileSync(path.join("prisma/migrations", e.name, "migration.sql")))
        .digest("hex")
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function historySafe(history, source, tableCount) {
  if (!history.length && tableCount)
    throw Error(
      "Existing database has no migration history. Baseline review is required; do not reset it."
    );
  for (const row of history) {
    const file = source.find((m) => m.name === row.migration_name);
    if (!row.finished_at || row.rolled_back_at || !file || file.checksum !== row.checksum)
      throw Error("Migration history requires review; do not reset or rewrite it.");
  }
}
async function inspect(db, source) {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const identity = await tx.$queryRawUnsafe(
      "SELECT current_database() AS database, current_setting('server_version_num')::integer AS version"
    );
    const tables = await tx.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
    );
    const names = new Set(tables.map((t) => t.table_name));
    const history = names.has("_prisma_migrations")
      ? await tx.$queryRawUnsafe(
          "SELECT migration_name,checksum,finished_at,rolled_back_at FROM public._prisma_migrations ORDER BY started_at"
        )
      : [];
    historySafe(
      history,
      source,
      tables.filter((t) => t.table_name !== "_prisma_migrations").length
    );
    const columns = await tx.$queryRawUnsafe(
      "SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public'"
    );
    const fields = new Set(columns.map((c) => c.table_name + "." + c.column_name));
    const required = [
      "Registration.guestCheckoutHash",
      ...[
        "captureRequestId",
        "captureStartedAt",
        "createRequestId",
        "environment",
        "lastReconciledAt",
        "merchantId",
        "operationUntil",
        "paypalCaptureId",
        "paypalOrderId",
        "snapshot",
        "version"
      ].map((c) => "Payment." + c)
    ];
    let legacyPaypalRows = 0;
    if (names.has("Payment")) {
      const [count] = await tx.$queryRawUnsafe(
        "SELECT count(*)::integer AS count FROM \"Payment\" WHERE provider='PAYPAL'"
      );
      legacyPaypalRows = count.count;
    }
    return {
      database: identity[0].database,
      postgresVersion: identity[0].version,
      applied: history.map((m) => m.migration_name),
      pending: source
        .filter((m) => !history.some((h) => h.migration_name === m.name))
        .map((m) => m.name),
      missingColumns: required.filter((c) => !fields.has(c)),
      missingTables: ["PaymentWebhook", "PaymentOutbox", "RequestBucket"].filter(
        (t) => !names.has(t)
      ),
      legacyPaypalRows
    };
  });
}
async function main(args = process.argv.slice(2)) {
  if (args.length !== 1 || !["--check", "--apply"].includes(args[0]))
    throw Error("Use --check (read only) or --apply (deploy reviewed migrations).");
  const env = migrationEnvironment(process.env);
  const source = inventory();
  const db = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: []
  });
  try {
    let result = await inspect(db, source);
    console.log(JSON.stringify({ phase: "preflight", ...result }));
    if (args[0] === "--apply" && result.pending.length) {
      if (result.postgresVersion < 120000)
        throw Error("The checkout migration requires PostgreSQL 12 or newer.");
      if (result.legacyPaypalRows)
        throw Error(
          "Existing PayPal records require finance/migration review before deployment."
        );
      const child = spawnSync(
        process.execPath,
        [
          "node_modules/prisma/build/index.js",
          "migrate",
          "deploy",
          "--schema=prisma/schema.prisma"
        ],
        { env, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", windowsHide: true }
      );
      if (child.status !== 0 || child.error)
        throw Error(
          "Migration deployment failed; inspect migration history before retrying. Do not reset the database."
        );
      result = await inspect(db, source);
      console.log(JSON.stringify({ phase: "after_migration", ...result }));
    }
    if (
      result.pending.length ||
      result.missingColumns.length ||
      result.missingTables.length
    ) {
      console.error(
        "Application schema is not ready. Back up the selected database and review its pending migrations before --apply."
      );
      process.exitCode = 1;
    } else console.log("Application checkout schema is ready.");
  } finally {
    await db.$disconnect();
  }
}
module.exports = { migrationEnvironment, historySafe };
if (require.main === module)
  main().catch((e) => {
    console.error(
      e.code
        ? "Database preflight failed (" + e.code + ")."
        : e instanceof TypeError
          ? "Invalid database configuration."
          : e.message
    );
    process.exitCode = 1;
  });
