import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { specBlobPath, specDownloadFilename } from "@/lib/spec-paths";

describe("spec storage paths", () => {
  it("stores specs at specs/{projectId}/{specId}.md", () => {
    assert.equal(
      specBlobPath("checkout-service-opfqox", "11111111-2222-3333-4444-555555555555"),
      "specs/checkout-service-opfqox/11111111-2222-3333-4444-555555555555.md",
    );
  });

  it("downloads as a markdown attachment name", () => {
    assert.equal(
      specDownloadFilename("11111111-2222-3333-4444-555555555555"),
      "spec-11111111-2222-3333-4444-555555555555.md",
    );
  });
});
