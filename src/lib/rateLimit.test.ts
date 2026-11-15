import { describe, expect, it } from "bun:test";
import { createRateLimiter } from "../../supabase/functions/_shared/rateLimit.ts";

describe("best-effort server request limits", () => {
  it("allows twelve requests per account in one minute and denies the thirteenth", () => {
    let now = 1_000;
    const allowRequest = createRateLimiter(12, 60_000, () => now);

    for (let request = 0; request < 12; request += 1) {
      expect(allowRequest("account-a")).toBe(true);
    }
    expect(allowRequest("account-a")).toBe(false);
  });

  it("resets the account window after one minute", () => {
    let now = 1_000;
    const allowRequest = createRateLimiter(12, 60_000, () => now);

    for (let request = 0; request < 12; request += 1) allowRequest("account-a");
    now += 60_000;

    expect(allowRequest("account-a")).toBe(true);
  });
});