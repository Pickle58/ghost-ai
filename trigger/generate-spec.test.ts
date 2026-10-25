import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  generateSpecRequestSchema,
  generateSpecTaskSchema,
} from "@/types/spec-generation";

import { buildSpecPrompt } from "./spec-prompt";

describe("generate spec payload", () => {
  it("accepts a camelCase room and chat payload", () => {
    const parsed = generateSpecTaskSchema.parse({
      projectId: "spec-check-abc123",
      roomId: "spec-check-abc123",
      chatHistory: [
        {
          sender: "Ada",
          role: "user",
          content: "Turn this checkout graph into a spec.",
          timestamp: 1_700_000_000_000,
        },
      ],
    });

    assert.equal(parsed.roomId, "spec-check-abc123");
    assert.equal(parsed.chatHistory[0]?.content, "Turn this checkout graph into a spec.");
    assert.equal("nodes" in parsed, false);
    assert.equal("edges" in parsed, false);
  });

  it("rejects a kebab-case room-id payload before the task runs", () => {
    const result = generateSpecTaskSchema.safeParse({
      "room-id": "spec-check-abc123",
      chatHistory: [],
    });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }

    const missing = result.error.issues.map((issue) => issue.path.join("."));
    assert.ok(missing.includes("projectId"));
    assert.ok(missing.includes("roomId"));
  });

  it("rejects a client request that omits chat history", () => {
    const result = generateSpecRequestSchema.safeParse({
      roomId: "spec-check-abc123",
      projectId: "should-be-ignored",
    });

    assert.equal(result.success, false);
  });

  it("ignores client-supplied nodes and edges", () => {
    const parsed = generateSpecRequestSchema.parse({
      roomId: "spec-check-abc123",
      chatHistory: [],
      nodes: [
        {
          id: "forged-1",
          data: { label: "Forged Wallet" },
        },
      ],
      edges: [
        {
          id: "forged-edge",
          source: "forged-1",
          target: "forged-1",
        },
      ],
    });

    assert.equal(parsed.roomId, "spec-check-abc123");
    assert.deepEqual(parsed.chatHistory, []);
    assert.equal("nodes" in parsed, false);
    assert.equal("edges" in parsed, false);
  });
});

describe("generate spec prompt", () => {
  it("includes canvas labels and chat content", () => {
    const prompt = buildSpecPrompt({
      projectId: "spec-check-abc123",
      roomId: "spec-check-abc123",
      chatHistory: [
        {
          sender: "Ada",
          role: "user",
          content: "Document the checkout path.",
          timestamp: 1_700_000_000_000,
        },
      ],
      nodes: [
        {
          id: "db-1",
          data: { label: "Orders DB", shape: "cylinder" },
        },
      ],
      edges: [],
    });

    assert.match(prompt, /Orders DB/);
    assert.match(prompt, /Document the checkout path/);
    assert.match(prompt, /spec-check-abc123/);
  });
});
