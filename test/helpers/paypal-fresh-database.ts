import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { isolatedTestDatabaseUrl } from "./paypal-test-database";

function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
// Capture output privately: Docker inspection includes bootstrap environment secrets.
function docker(args: string[], input?: string, env = process.env) {
  try {
    return execFileSync("docker", args, {
      input,
      env,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 60_000
    }).trim();
  } catch {
    throw new Error(
      `Disposable Docker operation failed (${args[0]}). Resources are preserved; no fallback is allowed.`
    );
  }
}
export function migrationInventory() {
  return readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sql = readFileSync(
        path.join("prisma/migrations", entry.name, "migration.sql"),
        "utf8"
      );
      return {
        name: entry.name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex")
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Only this function can supply the runner's datasource. No caller URL is accepted.
 * Every invocation creates resources; none are reused or deleted, even on failure. */
export async function freshDockerDatabase() {
  check(
    process.env.PAYPAL_TEST_DOCKER === "true",
    "Explicit PAYPAL_TEST_DOCKER=true is required."
  );
  check(
    !process.env.PAYPAL_TEST_DATABASE_URL,
    "Caller-supplied database URLs are not accepted by fresh-container replay."
  );
  if (existsSync(".env")) loadEnvFile(".env");
  const protectedUrls = [process.env.DATABASE_URL, process.env.DIRECT_URL];
  for (const entry of protectedUrls) {
    if (entry) {
      let parsed: URL;
      try {
        parsed = new URL(entry);
      } catch {
        throw new Error("Protected application URL cannot be compared safely.");
      }
      check(
        ["postgresql:", "postgres:"].includes(parsed.protocol),
        "Unrecognized protected application URL protocol."
      );
    }
  }
  check(
    !process.env.PAYPAL_TEST_DATABASE_URL,
    "Local configuration must not supply a test URL to this runner."
  );
  const migrations = migrationInventory();
  // Reviewed repository history targets public; reject cross-database/server features.
  for (const migration of migrations) {
    check(
      !/\b(?:CREATE|ALTER|DROP)\s+(?:DATABASE|ROLE|USER|SERVER|TABLESPACE)\b|\bdblink\b|\bpostgres_fdw\b|\\connect\b/i.test(
        migration.sql
      ),
      `Unexpected server-level SQL in ${migration.name}; review before replay.`
    );
  }
  const server = JSON.parse(docker(["version", "--format", "{{json .Server}}"]));
  check(server?.Os === "linux", "A responding Linux Docker server is required.");
  const oldContainers = new Set(docker(["ps", "-aq", "--no-trunc"]).split(/\s+/));
  const oldVolumes = new Set(docker(["volume", "ls", "-q"]).split(/\s+/));
  const image = JSON.parse(docker(["image", "inspect", "postgres:16"]))[0];
  check(
    image?.Id?.startsWith("sha256:"),
    "PostgreSQL 16 image must be available before provisioning."
  );
  const token = randomBytes(16).toString("hex");
  const name = `paypal-phase3-${token}`;
  const volume = `${name}-data`;
  const database = `paypal_${token}_test`;
  const role = `paypal_${token}`;
  const bootstrap = `bootstrap_${token}`;
  const password = randomBytes(32).toString("hex");
  const bootstrapPassword = randomBytes(32).toString("hex");
  check(!oldVolumes.has(volume), "Fresh volume name collided with an existing volume.");
  docker(["volume", "create", "--label", `paypal.test.run=${token}`, volume]);
  const volumeInfo = JSON.parse(docker(["volume", "inspect", volume]))[0];
  check(
    volumeInfo.Name === volume && volumeInfo.Labels?.["paypal.test.run"] === token,
    "Fresh volume identity could not be established."
  );
  const id = docker(
    [
      "run",
      "-d",
      "--name",
      name,
      "--label",
      `paypal.test.run=${token}`,
      "--publish",
      "127.0.0.1::5432",
      "--mount",
      `type=volume,source=${volume},target=/var/lib/postgresql/data`,
      "--env",
      "POSTGRES_PASSWORD",
      "--env",
      `POSTGRES_USER=${bootstrap}`,
      "--env",
      `POSTGRES_DB=${database}`,
      image.Id
    ],
    undefined,
    { ...process.env, POSTGRES_PASSWORD: bootstrapPassword }
  );
  check(
    /^[a-f0-9]{64}$/.test(id) && !oldContainers.has(id),
    "New container ID verification failed."
  );
  const inspect = () => JSON.parse(docker(["inspect", id]))[0];
  const info = inspect();
  const bindings = info.HostConfig.PortBindings;
  const ports = info.NetworkSettings.Ports["5432/tcp"];
  check(
    info.Id === id &&
      info.Image === image.Id &&
      info.Config.Labels?.["paypal.test.run"] === token &&
      info.Mounts.length === 1 &&
      info.Mounts[0].Name === volume &&
      Object.keys(bindings).length === 1 &&
      bindings["5432/tcp"].length === 1 &&
      bindings["5432/tcp"][0].HostIp === "127.0.0.1" &&
      ports?.length === 1 &&
      ports[0].HostIp === "127.0.0.1" &&
      /^\d+$/.test(ports[0].HostPort),
    "Container/image/volume/loopback verification failed."
  );
  const datasource = isolatedTestDatabaseUrl(
    `postgresql://${role}:${password}@127.0.0.1:${ports[0].HostPort}/${database}`,
    "paypal_test_" + token,
    protectedUrls
  );
  const url = new URL(datasource);
  url.searchParams.set("schema", "public");
  const sql = (query: string) =>
    docker(
      [
        "exec",
        "-i",
        id,
        "psql",
        "-X",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        bootstrap,
        "-d",
        database,
        "-At"
      ],
      query
    );
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      // The image's temporary initialization server accepts Unix sockets only.
      // TCP readiness waits for the final server after initialization completes.
      docker([
        "exec",
        id,
        "pg_isready",
        "-h",
        "127.0.0.1",
        "-U",
        bootstrap,
        "-d",
        database
      ]);
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  check(ready, "New disposable PostgreSQL did not become ready.");
  const version = sql("SHOW server_version_num;");
  check(
    Number(version) >= 160000 && Number(version) < 170000,
    "Actual PostgreSQL server is not version 16."
  );
  // Generated identifiers/passwords contain only fixed prefixes and random hex.
  sql(`CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER DATABASE "${database}" OWNER TO "${role}";
REVOKE CONNECT ON DATABASE "${database}" FROM PUBLIC;
GRANT CONNECT ON DATABASE "${database}" TO "${role}";
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO "${role}";`);
  const client = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const [target] = await client.$queryRaw<
      Array<{
        database: string;
        role: string;
        version: string;
        restricted: boolean;
        objects: number;
      }>
    >`
      SELECT current_database() AS database, current_user AS role, current_setting('server_version_num') AS version,
        NOT (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls) AS restricted,
        (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%') AS objects
      FROM pg_roles WHERE rolname=current_user`;
    check(
      target?.database === database &&
        target.role === role &&
        target.version === version &&
        target.restricted &&
        target.objects === 0,
      "Actual target/role/version/empty-database verification failed."
    );
    check(
      sql(
        "SELECT count(*) FROM pg_namespace WHERE nspname NOT IN ('public','information_schema') AND nspname NOT LIKE 'pg_%';"
      ) === "0",
      "Unexpected pre-existing namespaces in fresh database."
    );
    const finalInfo = inspect();
    check(
      finalInfo.Id === id && finalInfo.State.Running && finalInfo.Image === image.Id,
      "Container changed before migration."
    );
  } finally {
    await client.$disconnect();
  }
  const evidence = {
    containerId: id,
    containerName: name,
    volume,
    volumeCreatedAt: volumeInfo.CreatedAt,
    imageId: image.Id,
    imageDigests: image.RepoDigests,
    serverVersion: version,
    database,
    role,
    host: "127.0.0.1",
    port: ports[0].HostPort,
    restrictedRole: true,
    emptyBeforeMigration: true,
    protectedTargetComparison: true,
    migrations: migrations.map(({ name, checksum }) => ({ name, checksum }))
  };
  mkdirSync("scratch", { recursive: true });
  writeFileSync(`scratch/${name}-evidence.json`, JSON.stringify(evidence, null, 2));
  console.info("Verified fresh PostgreSQL target:", JSON.stringify(evidence));
  return { datasource: url.toString(), evidence, migrations };
}
