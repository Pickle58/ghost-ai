Cap AI cost with request size limits and a per-user rate limit on `/api/ai/*`.

Implement this unit after Feature 31, because the spec request schema no longer carries client nodes and edges.

### Implementation

1. Size limits

Enforce these exact limits:

- Design prompt: 1–4000 characters after trim
- Spec `chatHistory`: max 50 messages; `sender` max 80 characters; `content` max 2000 characters
- After the Feature 31 Liveblocks snapshot: if nodes exceed 200 or edges exceed 400, fail the task with a clear error and do not send the full graph to Gemini

Put the chat and prompt limits in Zod (`types/spec-generation.ts` and the design route prompt check). Put the snapshot caps in `generate-spec` after the room is read.

2. Rate limit

Shared across `POST /api/ai/design` and `POST /api/ai/spec`:

- 10 `TaskRun` rows per `userId` in the last 10 minutes
- over the limit returns `429` with `{ "error": "Too many AI requests" }`

Add a helper such as `lib/ai-rate-limit.ts` that counts Prisma `TaskRun` rows by `userId` and `createdAt`. Call it from both AI start routes before triggering a task.

Do not add Redis.

3. Tests

Add tests for:

- an oversize design prompt or chat message returning 400
- the 11th AI start in a 10-minute window returning 429
- unsigned requests still returning 401

### Scope Limits

- Do not add billing or usage dashboards
- Do not change the Gemini model or add provider fallback
- Do not change Trigger retry (`maxAttempts: 1` stays)
- Do not change spec prompt sections or the commerce pack
- Do not rate-limit token, list, or download routes

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- Reuse the existing `TaskRun` table; do not add a new rate-limit table
- Count runs before creating the next `TaskRun`

### Check When Done

- Oversize bodies return 400
- The 11th AI start in 10 minutes returns 429
- Unsigned requests return 401
- TypeScript and build pass
