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
- Canvas snapshots are saved through `PUT /api/projects/[projectId]/canvas`. The handler writes the blob URL to `Project.canvasJsonPath` and returns `{ ok: true }`. The blob URL is not returned to the client. `GET` returns `{ canvas }` only.

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
- Execution: `POST /api/ai/design` authenticates the user, resolves project access from `roomId` (never a client-supplied `projectId`), rejects a prompt outside 1–4000 characters after trim, then atomically reserves a `TaskRun` slot for that `userId` in the last 10 minutes (shared with spec starts; 10 is the cap) before triggering `design-agent` with `projectId` and `roomId` both set to `project.id`. The reservation is the same `TaskRun` row the route later binds to the real run id. Gemini (`@ai-sdk/google`) plans canvas operations, then the task applies them through `mutateFlow`. An 11th start in that window returns `{ "error": "Too many AI requests" }` with `429`. Token, list, and download routes are not rate-limited.
- Output: structured node and edge updates written into the shared Liveblocks room, plus AI presence (`cursor`, `thinking`) and `ai-status-feed` messages so every participant can see progress. Every generated `add-edge` writes a non-empty `data.label` so the canvas pill renders. Gemini is told to label every edge. A missing or blank label is inferred from the destination node (`Read/Write` for databases, `Publish Event` for queues/brokers, `cache` for caches, otherwise `HTTP`). Keyword fallback uses those destination labels instead of `request` / `data`. A commerce domain pack wins when the prompt matches those terms as whole words (`e-commerce|ecommerce|commerce|shop|storefront|checkout`), producing Storefront, API Gateway, Catalog, Cart, Checkout, Payment, Inventory, Notification, Webhook Worker, and Orders DB with flow-specific edges. Substrings such as “workshop” do not select the pack. Chat and CI/CD packs are later work.
- Room chat lives in a separate Liveblocks feed named `ai-chat`. Status and chat messages stay in their own feeds. The AI sidebar has AI Architect, Chat, and Specs tabs. Chat writes only to `ai-chat`. AI Architect also writes to `ai-chat` and starts a design run through `POST /api/ai/design`, stores `{ runId, publicToken }`, and tracks the run with `useRealtimeRun`. Canvas nodes and edges still update only through Liveblocks.

### Spec Generation

- Input: `roomId`, `chatHistory`, and project context resolved from `roomId`. The current canvas graph is read on the server from the Liveblocks room snapshot. Client `nodes` and `edges` are ignored.
- Execution: `POST /api/ai/spec` authenticates the user, resolves project access from `roomId` (never a client-supplied `projectId`), rejects `chatHistory` over 50 messages or a sender over 80 / content over 2000 characters, then atomically reserves a `TaskRun` slot for that `userId` in the last 10 minutes (shared with design starts; 10 is the cap) before triggering `generate-spec`. The reservation counts even while the route waits for a Trigger handle id. After the Liveblocks snapshot, more than 200 nodes or 400 edges fails the task without sending the graph to Gemini. `POST /api/ai/spec/token` issues a 1-hour Trigger.dev public access token scoped to that run, only for the run owner. Gemini (`@ai-sdk/google`) writes the spec as task output. The primary model is `gemini-3.8-flash`. If Gemini reports overload or high demand after the AI SDK’s short retries, the task waits 20s then 45s with `wait.for` and retries that same call. If the primary model is still overloaded, it tries `gemini-3.7-flash` with the same waits. A daily / free-tier quota error is not retried and aborts the run. Task-level `maxAttempts` stays 1, so empty specs and missing headings still abort.
- Output of the generation task: plain Markdown with these sections in order: Overview, Components, APIs / events, Data model, Authn / Authz, Threat model, Failure modes, and Open questions. Inferred lines are prefixed with `Assumption:`. The task rejects an empty spec, then rejects a spec that is missing any of those eight headings, before uploading. After generation, the task uploads that Markdown to Vercel Blob at `specs/{projectId}/{specId}.md` and stores the blob URL on `ProjectSpec.filePath`. Authenticated owners and collaborators list metadata through `GET /api/projects/[projectId]/specs` and download through `GET /api/projects/[projectId]/specs/[specId]/download`, which streams the file after project and spec access checks. The Specs tab previews that same download as Markdown. Preview sanitizes with `rehype-sanitize`, keeps only `http:` / `https:` links, and drops images. Download stays raw Markdown. Blob URLs are not returned to the client.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
