/**
 * Edge-compatible rate limit for middleware (no Node APIs).
 * In-memory per instance; use for best-effort throttling.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }
  return { success: true, remaining };
}
