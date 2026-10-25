# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma 8 + PostgreSQL   | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: access control helpers and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `src/prisma` — Prisma 8 data contract, emitted contract artifacts, and the `db` runtime. `prisma.config.ts` at the repo root points the CLI at that contract.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt and project context resolved from `roomId`.
- Execution: `POST /api/ai/design` authenticates the user, resolves project access from `roomId` (never a client-supplied `projectId`), creates a `TaskRun`, and triggers `design-agent` with `projectId` and `roomId` both set to `project.id`. Gemini (`@ai-sdk/google`) plans canvas operations, then the task applies them through `mutateFlow`.
- Output: structured node and edge updates written into the shared Liveblocks room, plus AI presence (`cursor`, `thinking`) and `ai-status-feed` messages so every participant can see progress.
- Room chat lives in a separate Liveblocks feed named `ai-chat`. Status and chat messages stay in their own feeds. The AI sidebar has AI Architect, Chat, and Specs tabs. Chat writes only to `ai-chat`. AI Architect also writes to `ai-chat` and starts a design run through `POST /api/ai/design`, stores `{ runId, publicToken }`, and tracks the run with `useRealtimeRun`. Canvas nodes and edges still update only through Liveblocks.

### Spec Generation

- Input: `roomId`, `chatHistory`, and project context resolved from `roomId`. The current canvas graph is read on the server from the Liveblocks room snapshot. Client `nodes` and `edges` are ignored.
- Execution: `POST /api/ai/spec` authenticates the user, resolves project access from `roomId` (never a client-supplied `projectId`), creates a `TaskRun`, and triggers `generate-spec`. `POST /api/ai/spec/token` issues a 1-hour Trigger.dev public access token scoped to that run, only for the run owner. Gemini (`@ai-sdk/google`) writes the spec as task output.
- Output of the generation task: plain Markdown. After generation, the task uploads that Markdown to Vercel Blob at `specs/{projectId}/{specId}.md` and stores the blob URL on `ProjectSpec.filePath`. Authenticated owners and collaborators list metadata through `GET /api/projects/[projectId]/specs` and download through `GET /api/projects/[projectId]/specs/[specId]/download`, which streams the file after project and spec access checks. The Specs tab previews that same download as Markdown. Blob URLs are not returned to the client.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
