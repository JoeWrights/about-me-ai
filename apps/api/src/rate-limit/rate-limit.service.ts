import { HttpException, HttpStatus, Injectable, Optional } from "@nestjs/common";

type RateLimitBucket = {
  dayCount: number;
  dayWindowStart: number;
  minuteCount: number;
  minuteWindowStart: number;
};

export type RateLimitOptions = {
  maxQuestionLength: number;
  now?: () => number;
  perDay: number;
  perMinute: number;
};

export type RateLimitInput = {
  key: string;
  question: string;
};

const minuteInMs = 60_000;
const dayInMs = 24 * 60 * 60 * 1_000;

export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly now: () => number;

  constructor(@Optional() private readonly options = readOptionsFromEnv()) {
    this.now = options.now ?? Date.now;
  }

  assertAllowed({ key, question }: RateLimitInput) {
    if (question.length > this.options.maxQuestionLength) {
      throw new RateLimitExceededError("问题太长，请精简后再试。");
    }

    const now = this.now();
    const bucket = this.getBucket(key, now);

    if (now - bucket.minuteWindowStart >= minuteInMs) {
      bucket.minuteCount = 0;
      bucket.minuteWindowStart = now;
    }

    if (now - bucket.dayWindowStart >= dayInMs) {
      bucket.dayCount = 0;
      bucket.dayWindowStart = now;
    }

    if (bucket.minuteCount >= this.options.perMinute) {
      throw new RateLimitExceededError("提问太频繁，请稍后再试。");
    }

    if (bucket.dayCount >= this.options.perDay) {
      throw new RateLimitExceededError("今日提问次数已达上限，请明天再试。");
    }

    bucket.minuteCount += 1;
    bucket.dayCount += 1;
  }

  toHttpException(error: RateLimitExceededError) {
    return new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
  }

  private getBucket(key: string, now: number) {
    const existing = this.buckets.get(key);
    if (existing) {
      return existing;
    }

    const bucket: RateLimitBucket = {
      dayCount: 0,
      dayWindowStart: now,
      minuteCount: 0,
      minuteWindowStart: now,
    };
    this.buckets.set(key, bucket);
    return bucket;
  }
}

function readOptionsFromEnv(): RateLimitOptions {
  return {
    maxQuestionLength: Number(process.env.MAX_QUESTION_LENGTH ?? 800),
    perDay: Number(process.env.RATE_LIMIT_PER_DAY ?? 50),
    perMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 6),
  };
}
