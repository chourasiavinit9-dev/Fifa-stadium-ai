// src/lib/rateLimiter.ts

interface Entry {
  timestamps: number[];
}

const store = new Map<string, Entry>();

// Cleanup every 5 minutes — remove expired timestamps
const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * @description Checks whether an IP address is within the allowed request rate for a given route.
 * @param {string} ip - The client IP address
 * @param {string} route - The API route path being accessed
 * @param {number} maxRequests - Maximum number of requests allowed in the time window
 * @param {number} windowMs - The sliding window duration in milliseconds (default: 60 000)
 * @returns {{ allowed: boolean; remaining: number; resetAt: number }} Rate limit result with remaining count and reset timestamp
 */
export function checkRateLimit(
  ip: string,
  route: string,
  maxRequests: number,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + windowMs
    : now + windowMs;

  if (entry.timestamps.length >= maxRequests) {
    store.set(key, entry);
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt,
  };
}

/**
 * @description Per-route maximum request limits per 60-second window.
 * @returns {Record<string, number>} Map of route prefix to max requests allowed
 */
export const RATE_LIMITS = {
  "/api/worldcup": 300, // raised — static data, no quota cost
  "/api/gemini": 40,
  "/api/gemini-ops": 60,
  "/api/anomaly": 30,
} as const;
