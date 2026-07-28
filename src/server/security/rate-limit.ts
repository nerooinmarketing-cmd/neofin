/**
 * In-memory sliding-window rate limiter. Good enough for a single Next.js
 * instance; a multi-instance production deployment must move this to a
 * shared store (Redis/Upstash) since counters here are per-process.
 */
const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export function checkRateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    hits.set(key, timestamps);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
}
