import assert from "node:assert/strict";
import test from "node:test";
import {
  RateLimitExceededError,
  RateLimitService,
} from "../src/rate-limit/rate-limit.service.js";

test("RateLimitService blocks requests over the per-minute limit", () => {
  const service = new RateLimitService({
    now: () => 1_000,
    perDay: 10,
    perMinute: 2,
    maxQuestionLength: 100,
  });

  service.assertAllowed({ key: "127.0.0.1", question: "hello" });
  service.assertAllowed({ key: "127.0.0.1", question: "hello again" });

  assert.throws(
    () => service.assertAllowed({ key: "127.0.0.1", question: "third" }),
    RateLimitExceededError,
  );
});

test("RateLimitService blocks requests over the daily limit", () => {
  const service = new RateLimitService({
    now: () => 1_000,
    perDay: 1,
    perMinute: 10,
    maxQuestionLength: 100,
  });

  service.assertAllowed({ key: "127.0.0.1", question: "hello" });

  assert.throws(
    () => service.assertAllowed({ key: "127.0.0.1", question: "again" }),
    /今日提问次数已达上限/,
  );
});

test("RateLimitService blocks overly long questions before counting quota", () => {
  const service = new RateLimitService({
    now: () => 1_000,
    perDay: 1,
    perMinute: 1,
    maxQuestionLength: 5,
  });

  assert.throws(
    () => service.assertAllowed({ key: "127.0.0.1", question: "too long" }),
    /问题太长/,
  );

  service.assertAllowed({ key: "127.0.0.1", question: "short" });
});
