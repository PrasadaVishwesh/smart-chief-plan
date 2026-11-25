import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../supabase/functions/_shared/rateLimit.ts";

describe("best-effort server request limits", () => {
  it("allows twelve requests per account in one minute and denies the thirteenth", () => {
    let now = 1_000;
    const allowRequest = createRateLimiter(12, 60_000, () => now);

    for (let request = 0; request < 12; request += 1) {
      assert.equal(allowRequest("account-a"), true);
    }
    assert.equal(allowRequest("account-a"), false);
  });

  it("resets the account window after one minute", () => {
    let now = 1_000;
    const allowRequest = createRateLimiter(12, 60_000, () => now);

    for (let request = 0; request < 12; request += 1) allowRequest("account-a");
    now += 60_000;

    assert.equal(allowRequest("account-a"), true);
  });
});