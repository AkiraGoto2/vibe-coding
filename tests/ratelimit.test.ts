import { describe, it, expect } from "vitest";

describe("checkRateLimit with no Redis", () => {
  it("returns false (allow) when limiter is null", async () => {
    const { checkRateLimit } = await import("../lib/ratelimit");
    // null limiter = no Redis = graceful degradation
    const blocked = await checkRateLimit(null, "test-id");
    expect(blocked).toBe(false);
  });
});
