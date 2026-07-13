const cacheMap = new Map<string, { data: unknown; expiry: number }>();
const inFlightMap = new Map<string, Promise<unknown>>();

/**
 * Caches the results of a promise-returning function in memory.
 * Includes promise coalescing to prevent duplicate in-flight DB queries for the same key.
 */
export async function memoize<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cacheMap.get(key);
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  let inFlight = inFlightMap.get(key);
  if (!inFlight) {
    inFlight = fn()
      .then((res) => {
        cacheMap.set(key, { data: res, expiry: Date.now() + ttlMs });
        inFlightMap.delete(key);
        return res;
      })
      .catch((err) => {
        inFlightMap.delete(key);
        throw err;
      });
    inFlightMap.set(key, inFlight);
  }

  return inFlight as Promise<T>;
}
