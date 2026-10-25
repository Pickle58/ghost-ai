import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterPreviewHref } from "./spec-preview";

describe("filterPreviewHref", () => {
  it("keeps http and https links", () => {
    assert.equal(
      filterPreviewHref("link", "https://example.com/docs"),
      "https://example.com/docs",
    );
    assert.equal(
      filterPreviewHref("link", "http://example.com"),
      "http://example.com",
    );
    assert.equal(
      filterPreviewHref("link", "  HTTPS://example.com/docs  "),
      "HTTPS://example.com/docs",
    );
  });

  it("rejects javascript, data, and other protocols as links", () => {
    assert.equal(filterPreviewHref("link", "javascript:alert(1)"), null);
    assert.equal(filterPreviewHref("link", "JAVASCRIPT:alert(1)"), null);
    assert.equal(filterPreviewHref("link", "data:text/html,<h1>x</h1>"), null);
    assert.equal(filterPreviewHref("link", "mailto:ada@example.com"), null);
    assert.equal(filterPreviewHref("link", "/relative/path"), null);
    assert.equal(filterPreviewHref("link", "//example.com/docs"), null);
    assert.equal(filterPreviewHref("link", ""), null);
    assert.equal(filterPreviewHref("link", undefined), null);
  });

  it("drops images including http(s) sources", () => {
    assert.equal(filterPreviewHref("image", "https://example.com/x.png"), null);
    assert.equal(filterPreviewHref("image", "http://example.com/x.png"), null);
    assert.equal(filterPreviewHref("image", "javascript:alert(1)"), null);
    assert.equal(filterPreviewHref("image", undefined), null);
  });
});
