import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { APICallError, RetryError } from "ai";

import {
  FALLBACK_SPEC_MODEL,
  PRIMARY_SPEC_MODEL,
  SPEC_CAPACITY_BACKOFF_SECONDS,
  generateWithCapacityRetry,
  isProviderCapacityError,
} from "./ai-capacity";

function overloadError(statusCode = 503): APICallError {
  return new APICallError({
    message: "The model is overloaded. Please try again later.",
    url: "https://generativelanguage.googleapis.com",
    requestBodyValues: {},
    statusCode,
    isRetryable: true,
  });
}

describe("provider capacity errors", () => {
  it("treats 503 overloaded and wrapping RetryError as capacity errors", () => {
    const overloaded = overloadError();
    assert.equal(isProviderCapacityError(overloaded), true);
    assert.equal(isProviderCapacityError(overloadError(429)), true);
    assert.equal(
      isProviderCapacityError(
        new APICallError({
          message:
            "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          url: "https://generativelanguage.googleapis.com",
          requestBodyValues: {},
          isRetryable: true,
        }),
      ),
      true,
    );

    assert.equal(
      isProviderCapacityError(
        new RetryError({
          message: "Failed after 3 attempts",
          reason: "maxRetriesExceeded",
          errors: [overloaded],
        }),
      ),
      true,
    );
  });

  it("does not treat 400 or a generic error as a capacity error", () => {
    assert.equal(
      isProviderCapacityError(
        new APICallError({
          message: "Invalid request",
          url: "https://generativelanguage.googleapis.com",
          requestBodyValues: {},
          statusCode: 400,
          isRetryable: false,
        }),
      ),
      false,
    );
    assert.equal(isProviderCapacityError(new Error("Gemini returned an empty spec")), false);
    assert.equal(
      isProviderCapacityError(
        new APICallError({
          message:
            "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash. Please retry in 12h10m31s.",
          url: "https://generativelanguage.googleapis.com",
          requestBodyValues: {},
          statusCode: 429,
          isRetryable: true,
        }),
      ),
      false,
    );
  });
});

describe("generate with capacity retry", () => {
  it("waits then succeeds on a later primary-model attempt", async () => {
    const waits: number[] = [];
    let calls = 0;

    const result = await generateWithCapacityRetry({
      generate: async (modelId) => {
        calls += 1;
        if (calls === 1) {
          throw overloadError();
        }
        return `${modelId}:spec`;
      },
      wait: async (seconds) => {
        waits.push(seconds);
      },
    });

    assert.deepEqual(waits, [SPEC_CAPACITY_BACKOFF_SECONDS[0]]);
    assert.equal(result.modelId, PRIMARY_SPEC_MODEL);
    assert.equal(result.value, `${PRIMARY_SPEC_MODEL}:spec`);
    assert.equal(calls, 2);
  });

  it("falls back only after primary capacity attempts are exhausted", async () => {
    const models: string[] = [];
    const waits: number[] = [];

    const result = await generateWithCapacityRetry({
      generate: async (modelId) => {
        models.push(modelId);
        if (modelId === PRIMARY_SPEC_MODEL) {
          throw overloadError();
        }
        return "fallback-spec";
      },
      wait: async (seconds) => {
        waits.push(seconds);
      },
    });

    const primaryCalls = models.filter((modelId) => modelId === PRIMARY_SPEC_MODEL);
    assert.equal(primaryCalls.length, SPEC_CAPACITY_BACKOFF_SECONDS.length + 1);
    assert.deepEqual(waits, [...SPEC_CAPACITY_BACKOFF_SECONDS]);
    assert.equal(models.at(-1), FALLBACK_SPEC_MODEL);
    assert.equal(result.modelId, FALLBACK_SPEC_MODEL);
    assert.equal(result.value, "fallback-spec");
  });

  it("throws a non-capacity error immediately", async () => {
    const waits: number[] = [];

    await assert.rejects(
      () =>
        generateWithCapacityRetry({
          generate: async () => {
            throw new Error("GOOGLE_AI_API_KEY is not set");
          },
          wait: async (seconds) => {
            waits.push(seconds);
          },
        }),
      /GOOGLE_AI_API_KEY is not set/,
    );
    assert.deepEqual(waits, []);
  });
});
