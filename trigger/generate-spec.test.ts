import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  generateSpecRequestSchema,
  generateSpecTaskSchema,
} from "@/types/spec-generation";

import {
  assertSpecHasRequiredHeadings,
  assertSpecSnapshotSize,
  MAX_SPEC_SNAPSHOT_EDGES,
  MAX_SPEC_SNAPSHOT_NODES,
} from "./generate-spec";
import { buildSpecPrompt, REQUIRED_SPEC_HEADINGS } from "./spec-prompt";

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

  it("rejects an oversize chat message", () => {
    const result = generateSpecRequestSchema.safeParse({
      roomId: "spec-check-abc123",
      chatHistory: [
        {
          sender: "Ada",
          role: "user",
          content: "x".repeat(2001),
          timestamp: 1_700_000_000_000,
        },
      ],
    });

    assert.equal(result.success, false);
  });

  it("rejects more than 50 chat messages or an oversize sender", () => {
    const tooMany = generateSpecRequestSchema.safeParse({
      roomId: "spec-check-abc123",
      chatHistory: Array.from({ length: 51 }, (_, index) => ({
        sender: "Ada",
        role: "user" as const,
        content: `Message ${index}`,
        timestamp: 1_700_000_000_000 + index,
      })),
    });
    assert.equal(tooMany.success, false);

    const longSender = generateSpecRequestSchema.safeParse({
      roomId: "spec-check-abc123",
      chatHistory: [
        {
          sender: "A".repeat(81),
          role: "user",
          content: "Document the checkout path.",
          timestamp: 1_700_000_000_000,
        },
      ],
    });
    assert.equal(longSender.success, false);
  });
});

describe("generate spec snapshot caps", () => {
  it("fails the task when nodes or edges exceed the snapshot cap", () => {
    assert.doesNotThrow(() =>
      assertSpecSnapshotSize(MAX_SPEC_SNAPSHOT_NODES, MAX_SPEC_SNAPSHOT_EDGES),
    );

    assert.throws(
      () => assertSpecSnapshotSize(MAX_SPEC_SNAPSHOT_NODES + 1, 0),
      /too large to generate a spec/,
    );
    assert.throws(
      () => assertSpecSnapshotSize(0, MAX_SPEC_SNAPSHOT_EDGES + 1),
      /too large to generate a spec/,
    );
  });
});

function completeSpecMarkdown() {
  return REQUIRED_SPEC_HEADINGS.map((heading) => `## ${heading}\nKnown.`).join("\n");
}

function samplePromptInput() {
  return {
    projectId: "spec-check-abc123",
    roomId: "spec-check-abc123",
    chatHistory: [
      {
        sender: "Ada",
        role: "user" as const,
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
  };
}

describe("generate spec prompt", () => {
  it("includes canvas labels and chat content", () => {
    const prompt = buildSpecPrompt(samplePromptInput());

    assert.match(prompt, /Orders DB/);
    assert.match(prompt, /Document the checkout path/);
  });

  it("requires all eight spec sections and Assumption: for inferred detail", () => {
    const prompt = buildSpecPrompt(samplePromptInput());

    for (const section of REQUIRED_SPEC_HEADINGS) {
      assert.ok(
        prompt.includes(section),
        `expected prompt to include required section "${section}"`,
      );
    }

    assert.ok(
      prompt.includes("Assumption:"),
      "expected prompt to require Assumption: for inferred detail",
    );
  });

  it("does not inject raw project or room ids", () => {
    const prompt = buildSpecPrompt(samplePromptInput());

    assert.equal(prompt.includes("spec-check-abc123"), false);
  });
});

describe("generate spec heading acceptance", () => {
  it("accepts all eight required headings and fails when one is missing", () => {
    assert.doesNotThrow(() => assertSpecHasRequiredHeadings(completeSpecMarkdown()));

    const missingThreat = completeSpecMarkdown().replace("## Threat model\nKnown.\n", "");
    assert.throws(
      () => assertSpecHasRequiredHeadings(missingThreat),
      /missing required sections: Threat model/,
    );
  });
});
