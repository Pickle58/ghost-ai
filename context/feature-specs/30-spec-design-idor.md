Close the design-run IDOR so `POST /api/ai/design` cannot point the worker at a Liveblocks room the caller is not allowed to access.

### Implementation

1. Request identity

Update `POST /api/ai/design`.

It should:

- accept `{ prompt, roomId }` only
- ignore a client-supplied `projectId`
- require a non-empty `roomId`
- authenticate the current user
- resolve project access with `getAccessibleProject(roomId, identity)`

Do not trust a client-supplied `projectId`. Do not fall back to `roomId || projectId`.

2. Task payload

After the project is loaded:

- set `projectId` to `project.id`
- set `roomId` to `project.id`
- pass those values into `designAgentTask`

The Liveblocks mutation target must be the same id that passed the access check.

3. Tests

Add a focused test around the resolve/parse helper so a body of `{ projectId: attackerProject, roomId: victimRoom }` access-checks `victimRoom` and, if allowed, writes only to `project.id`.

A missing or blank `roomId` returns 400. An unsigned request still returns 401.

### Scope Limits

- Do not change the design prompt, Gemini plan, or canvas mutation logic
- Do not change the AI sidebar or `use-design-run` request shape (`{ prompt, roomId }` already matches)
- Do not change `POST /api/ai/design/token`
- Do not change spec generation routes
- Do not add rate limits in this unit

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- Mirror the access rule already used by `POST /api/ai/spec`
- `hooks/use-design-run.ts` already sends only `{ prompt, roomId }`
- Keep `{ runId, publicToken }` as the 202 response

### Check When Done

- A mismatched client `projectId` cannot retarget the Liveblocks room
- Missing `roomId` returns 400
- Unsigned requests return 401
- Existing design-agent tests still pass
- TypeScript and build pass
