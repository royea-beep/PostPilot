const rateMap = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();

  // Clean up expired entries
  for (const [k, v] of rateMap) {
    if (v.expiresAt <= now) {
      rateMap.delete(k);
    }
  }

  const entry = rateMap.get(key);

  if (!entry || entry.expiresAt <= now) {
    rateMap.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;

  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}
