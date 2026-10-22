import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { createDesignRunToken, verifyDesignRunToken } from "./design-agent";

describe("design agent token", () => {
  beforeEach(() => {
    process.env.DESIGN_RUN_TOKEN_SECRET = "super-secret";
  });

  it("creates a signed token with an expiry", () => {
    const token = createDesignRunToken({
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
    });

    assert.match(token, /\./);
    const parsed = verifyDesignRunToken(token);
    assert.deepEqual(parsed, {
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
      kind: "design-run-token",
      exp: parsed?.exp ?? 0,
    });
    assert.ok((parsed?.exp ?? 0) > Math.floor(Date.now() / 1000));
  });

  it("rejects tokens that are expired or tampered with", () => {
    const signedToken = createDesignRunToken({
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
    });

    const tampered = signedToken.replace(/.$/, "A");
    assert.equal(verifyDesignRunToken(tampered), null);

    const expired = [
      Buffer.from(JSON.stringify({
        runId: "run_123",
        projectId: "project_456",
        userId: "user_789",
        kind: "design-run-token",
        exp: 0,
      })).toString("base64url"),
      Buffer.from("bad-signature").toString("base64url"),
    ].join(".");

    assert.equal(verifyDesignRunToken(expired), null);
  });
});
