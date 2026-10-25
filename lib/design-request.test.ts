import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jsonError } from "@/lib/http";
import type { ClerkIdentity } from "@/lib/project-access";

import {
  parseDesignRequest,
  resolveDesignRunRequest,
  resolveDesignTaskTargets,
} from "./design-request";

const identity: ClerkIdentity = {
  userId: "user_owner",
  email: "owner@example.com",
};

describe("design request parse/resolve", () => {
  it("access-checks roomId and writes only to project.id when projectId is spoofed", async () => {
    const checked: string[] = [];
    const result = await resolveDesignRunRequest(
      {
        projectId: "attacker-project",
        roomId: "victim-room",
        prompt: "Add a checkout service.",
      },
      identity,
      async (roomId) => {
        checked.push(roomId);
        return { id: "canonical-victim-id" };
      },
    );

    assert.deepEqual(checked, ["victim-room"]);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.accessRoomId, "victim-room");
    assert.equal(result.projectId, "canonical-victim-id");
    assert.equal(result.roomId, "canonical-victim-id");
    assert.notEqual(result.projectId, "attacker-project");
    assert.notEqual(result.roomId, "attacker-project");
  });

  it("rejects a missing or blank roomId with 400", () => {
    const missing = parseDesignRequest({
      prompt: "Add a checkout service.",
      projectId: "attacker-project",
    });
    assert.equal(missing.ok, false);
    if (missing.ok) {
      return;
    }
    assert.equal(missing.status, 400);

    const blank = parseDesignRequest({
      prompt: "Add a checkout service.",
      roomId: "   ",
    });
    assert.equal(blank.ok, false);
    if (blank.ok) {
      return;
    }
    assert.equal(blank.status, 400);
  });

  it("rejects an oversize prompt with 400", async () => {
    const parsed = parseDesignRequest({
      prompt: "x".repeat(4001),
      roomId: "owned-room",
    });
    assert.equal(parsed.ok, false);
    if (parsed.ok) {
      return;
    }
    assert.equal(parsed.status, 400);

    const response = jsonError(parsed.error, parsed.status);
    assert.equal(response.status, 400);
  });

  it("accepts a prompt of 4000 characters after trim", () => {
    const parsed = parseDesignRequest({
      prompt: `  ${"x".repeat(4000)}  `,
      roomId: "owned-room",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) {
      return;
    }
    assert.equal(parsed.prompt.length, 4000);
  });

  it("uses the loaded project id as both task targets", () => {
    assert.deepEqual(resolveDesignTaskTargets({ id: "owned-room" }), {
      projectId: "owned-room",
      roomId: "owned-room",
    });
  });
});
