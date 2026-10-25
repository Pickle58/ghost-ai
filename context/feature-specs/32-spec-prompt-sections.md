Rewrite `buildSpecPrompt` so every generated spec uses a fixed section list and marks model-invented detail as `Assumption:`.

### Implementation

1. Required sections

Update `trigger/spec-prompt.ts` so the model always writes these sections, in this order:

1. Overview
2. Components — each component states responsibility and data owned
3. APIs / events
4. Data model
5. Authn / Authz
6. Threat model
7. Failure modes
8. Open questions

Do not omit a section. If the canvas or chat does not support a section, write what is known and prefix inferred lines with `Assumption:`.

2. Prompt rules

The prompt should:

- keep the canvas graph and chat history as the sources of truth
- tell the model to mark invented detail as `Assumption:` rather than staying silent
- write complete Markdown
- not wrap the document in a code fence
- stop putting raw project or room ids in the prompt unless they belong in the spec text

3. Tests

Extend `trigger/generate-spec.test.ts` so the built prompt includes all eight section names and the `Assumption:` rule.

### Scope Limits

- Do not change the Gemini model
- Do not change spec persistence, download, or preview
- Do not add a commerce domain pack (Feature 33)
- Do not change the request schema (Feature 31)
- Do not add frontend logic

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- A live `generate-spec` run is not required to finish this unit if prompt tests cover the contract
- Keep task output as plain Markdown

### Check When Done

- The prompt lists all eight required sections
- The prompt requires `Assumption:` for inferred detail
- Prompt tests fail if a required section is removed
- TypeScript and build pass
