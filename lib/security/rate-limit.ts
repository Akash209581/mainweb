import { RateLimitError } from "@/lib/errors/app-error";

interface RateLimitState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitState>();

export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  if (buckets.size >= 10_000) {
    for (const [bucketKey, state] of buckets) {
      if (state.resetAt <= now) buckets.delete(bucketKey);
    }
    if (!buckets.has(key) && buckets.size >= 10_000) throw new RateLimitError();
  }
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new RateLimitError();
  }

  current.count += 1;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
