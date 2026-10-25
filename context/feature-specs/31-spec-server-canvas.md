Generate specs from the Liveblocks room snapshot instead of a client-supplied canvas graph.

### Implementation

1. Request schema

Update `generateSpecRequestSchema` in `types/spec-generation.ts`.

The client request should accept:

- `roomId`
- `chatHistory`

Drop `nodes` and `edges` from the client request. The task schema still adds server-resolved `projectId`.

`POST /api/ai/spec` keeps resolving access from `roomId` and must not forward client graph fields.

2. Shared Liveblocks snapshot

Extract the existing `readCanvasSnapshot` helper from `trigger/design-agent.ts` into a small shared module such as `lib/liveblocks-flow.ts`.

Do not import `trigger/design-agent.ts` from `generate-spec`. That file is already a slow worker import.

3. Spec task

Update `trigger/generate-spec.ts` so that after the task starts it:

- reads the Liveblocks flow snapshot for `roomId`
- passes those nodes and edges into `buildSpecPrompt`
- logs the Liveblocks node and edge counts

An empty room still produces a brief spec.

4. Frontend

Update `components/editor/ai-sidebar-specs-panel.tsx` and `lib/spec-payload.ts` so Generate Spec sends `{ roomId, chatHistory }` only.

The Specs tab should not use `useLiveblocksFlow` just to start generation.

5. Tests and docs

Update `trigger/generate-spec.test.ts` for the new request shape. When this unit is implemented, update the Spec Generation input line in `context/architecture-context.md`.

### Scope Limits

- Do not rewrite spec prompt sections (Feature 32)
- Do not add rate limits or size caps (Feature 34)
- Do not read `ai-chat` from Liveblocks; `chatHistory` stays client-supplied
- Do not change spec persistence or download
- Do not change design-agent canvas writes

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- Reuse the same `mutateFlow` read the design agent already uses
- Treat a client `nodes` / `edges` payload as ignored or rejected, never as the source of truth

### Check When Done

- A request with forged nodes does not change the generated graph source
- `generate-spec` logs Liveblocks node and edge counts
- The Specs tab starts a run without sending canvas nodes
- Generate-spec tests and build pass
