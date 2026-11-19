/** Never log input URLs: they can contain credentials. No fallback is permitted. */
export function isolatedTestDatabaseUrl(
  raw: string | undefined,
  schema: string,
  protectedUrls: Array<string | undefined> = []
) {
  if (!raw) throw new Error("An explicit PAYPAL_TEST_DATABASE_URL is required.");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid test database URL.");
  }
  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/[A-Za-z0-9_]+_test$/.test(url.pathname) ||
    !/^paypal_test_[a-f0-9]{32}$/.test(schema)
  )
    throw new Error(
      "Only an explicitly approved local *_test database and a generated test schema are allowed."
    );
  const identity = (candidate: URL) =>
    [
      ["localhost", "127.0.0.1", "[::1]"].includes(candidate.hostname)
        ? "loopback"
        : candidate.hostname,
      candidate.port || "5432",
      decodeURIComponent(candidate.pathname)
    ].join(":");
  for (const entry of protectedUrls) {
    if (!entry) continue;
    let protectedUrl: URL;
    try {
      protectedUrl = new URL(entry);
    } catch {
      continue;
    }
    if (identity(url) === identity(protectedUrl))
      throw new Error(
        "Test target matches an application database; use a separate disposable database."
      );
  }
  for (const key of url.searchParams.keys()) {
    if (!["schema", "connection_limit", "pool_timeout", "sslmode"].includes(key))
      throw new Error("Unrecognized test database connection parameter.");
  }
  url.searchParams.set("schema", schema);
  return url.toString();
}
