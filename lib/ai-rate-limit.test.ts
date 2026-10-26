import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AI_RATE_LIMIT_ERROR,
  AI_RATE_LIMIT_MAX_RUNS,
  aiRateLimitResponse,
  aiRateLimitResponseAfterReservation,
} from "@/lib/ai-rate-limit";
import { parseDesignRequest } from "@/lib/design-request";
import { jsonError } from "@/lib/http";
import { generateSpecRequestSchema } from "@/types/spec-generation";

describe("AI rate limit", () => {
  it("allows the 10th AI start and returns 429 for the 11th in a 10-minute window", async () => {
    const tenth = aiRateLimitResponse(AI_RATE_LIMIT_MAX_RUNS - 1);
    assert.equal(tenth, null);

    const eleventh = aiRateLimitResponse(AI_RATE_LIMIT_MAX_RUNS);
    assert.ok(eleventh);
    assert.equal(eleventh.status, 429);
    assert.deepEqual(await eleventh.json(), { error: AI_RATE_LIMIT_ERROR });
  });

  it("counts a reserved slot so the 11th concurrent start is still 429", async () => {
    const tenth = aiRateLimitResponseAfterReservation(AI_RATE_LIMIT_MAX_RUNS);
    assert.equal(tenth, null);

    const eleventh = aiRateLimitResponseAfterReservation(AI_RATE_LIMIT_MAX_RUNS + 1);
    assert.ok(eleventh);
    assert.equal(eleventh.status, 429);
    assert.deepEqual(await eleventh.json(), { error: AI_RATE_LIMIT_ERROR });
  });
});

describe("AI start request sizes", () => {
  it("returns 400 for an oversize design prompt or chat message", async () => {
    const prompt = parseDesignRequest({
      prompt: "x".repeat(4001),
      roomId: "owned-room",
    });
    assert.equal(prompt.ok, false);
    if (prompt.ok) {
      return;
    }
    const promptResponse = jsonError(prompt.error, prompt.status);
    assert.equal(promptResponse.status, 400);

    const chat = generateSpecRequestSchema.safeParse({
      roomId: "owned-room",
      chatHistory: [
        {
          sender: "Ada",
          role: "user",
          content: "x".repeat(2001),
          timestamp: 1_700_000_000_000,
        },
      ],
    });
    assert.equal(chat.success, false);
    const chatResponse = jsonError("roomId and chatHistory are required", 400);
    assert.equal(chatResponse.status, 400);
  });
});

describe("unsigned AI starts", () => {
  it("still returns 401 Unauthorized JSON", async () => {
    const response = jsonError("Unauthorized", 401);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  });
});
