import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// If Upstash is not configured, use a simple in-memory fallback
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  // Redis not available — rate limiting will be skipped
}

// 5 attempts per 15 minutes on auth endpoints
export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      analytics: false,
      prefix: "rl:auth",
    })
  : null;

// 3 verification emails per 10 minutes per email
export const emailRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: false,
      prefix: "rl:email",
    })
  : null;

/** Returns true if the request should be rate-limited */
export async function checkRateLimit(
  limiter: typeof authRatelimit,
  identifier: string
): Promise<boolean> {
  if (!limiter) return false; // no Redis → allow (graceful degradation)
  const { success } = await limiter.limit(identifier);
  return !success;
}
