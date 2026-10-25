Stop returning Vercel Blob URLs from canvas save so the client never sees a storage URL.

### Implementation

1. Canvas save response

Update `PUT /api/projects/[projectId]/canvas`.

On success it should return `{ "ok": true }`.

Do not include `canvasUrl` or any other blob URL.

2. Storage helper

`saveCanvasSnapshot` in `lib/canvas-storage.ts` may still return the blob URL internally for the Prisma `canvasJsonPath` write.

The route must not send that URL to the client.

3. Frontend

`hooks/use-canvas-autosave.ts` already ignores the response body and only checks `response.ok`. Confirm no other caller reads `canvasUrl`.

### Scope Limits

- Do not change blob access mode or the `canvas/{projectId}.json` path
- Do not change `GET /api/projects/[projectId]/canvas` payload
- Do not change spec download or spec list
- Do not add frontend save-status work unless a caller actually depends on `canvasUrl`

### Notes

- Check `context/project-overview.md` and `context/architecture-context.md` first
- Spec list and download already hide blob URLs; canvas save should match that rule
- Persistence still stores the blob URL on `Project.canvasJsonPath`

### Check When Done

- A successful PUT JSON has no URL string
- GET canvas behavior is unchanged
- Autosave still treats `response.ok` as saved
- TypeScript and build pass
