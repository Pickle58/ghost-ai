Harden spec preview so generated Markdown cannot run script URLs or load arbitrary images.

### Implementation

1. Sanitize Markdown

Update `components/editor/spec-preview-dialog.tsx`.

- add `rehype-sanitize` and pass it to `react-markdown`
- do not add `rehype-raw`

2. Links

Keep the custom `a` renderer, but only render `http:` and `https:` hrefs.

`javascript:`, `data:`, and any other protocol must render as plain text, not as a link.

Http(s) links still open in a new tab with `rel="noreferrer"`.

3. Images

Map `img` to `null`. Drop images in preview. Do not add an image proxy.

4. Tests

Add a small unit test around a link/image filter helper so this unit does not need a full DOM test for the dialog.

### Scope Limits

- Do not change the download route; download stays raw Markdown
- Do not modify `components/ui/*`
- Do not change spec generation or persistence
- Do not add an image proxy or blob image host

### Notes

- Check `context/ui-context.md` for preview styling
- Reuse the existing Dialog preview; do not redesign the modal
- Install only `rehype-sanitize` if it is not already present

### Check When Done

- `javascript:` hrefs are not active links
- Images are not rendered
- Http(s) links still open in a new tab with `rel="noreferrer"`
- Lint and build pass
