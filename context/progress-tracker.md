# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Prisma 8 data layer

## Current Goal

- The Prisma 8 contract has `Project`, `ProjectCollaborator`, and `ProjectStatus`. The first schema is applied to PostgreSQL. Project APIs and the editor are not wired to the database.

## Completed

- Design system: shadcn/ui configured with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea. `lucide-react` is installed. `lib/utils.ts` exports `cn()`. Theme tokens in `app/globals.css` drive the dark palette, and shadcn semantic colors alias those tokens.
- Editor chrome: fixed-height navbar with a sidebar toggle, an overlay project sidebar, and a reusable dialog pattern. The sidebar has My Projects and Shared tabs and a full-width New Project button.
- Clerk: `@clerk/nextjs` and `@clerk/ui` are installed. `ClerkProvider` wraps the app inside `<body>` with the shadcn theme. `proxy.ts` runs `clerkMiddleware()`. Sign-in and sign-up routes exist. Sign-in, sign-up, and the user button render on the home screen and in the editor navbar. The project is linked to the existing Ghost AI Clerk application. Routes stay public until each page calls `await auth.protect()`.
- Project dialogs: `/editor` centers a home prompt with a New Project button. Create, rename, and delete dialogs are wired from that button and from the sidebar. Owned projects show rename and delete; shared projects do not. The create dialog shows a live slug. A mobile scrim closes the sidebar. `useProjectDialogs` holds dialog, form, and loading state. Projects are mock data, with no API calls or persistence.
- Prisma 8 data layer: `src/prisma/contract.prisma` defines `Project`, `ProjectCollaborator`, and `ProjectStatus` only. `ownerId` is the Clerk user ID as text. IDs are `String @id @default(uuid())`. Collaborator delete cascades from the project. Timestamps are `TimestamptzString` and `temporal.updatedAtString()`. Slugs are not stored. `prisma contract emit` and `prisma db init` succeeded against PostgreSQL. `src/prisma/db.ts` is the only runtime.

## In Progress

- None yet.

## Next Up

- Project APIs (`06-project-apis.md`): list, create, rename, and delete projects. Do not start that slice until asked.
- Decide sign-up and sign-in identifiers and social providers.
- Protect individual pages, Route Handlers, and Server Actions with `await auth.protect()` when those routes need a signed-in user.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Generated `components/ui/*` files stay as installed. Dark theme alignment lives in `app/globals.css`.
- The app is dark only. `:root` and `.dark` use the same palette, and `<html>` carries the `dark` class so component `dark:` styles apply.
- shadcn uses the `base-nova` style (Base UI). `cn()` is the `cn` package, re-exported from `lib/utils.ts`.
- Editor chrome lives in `components/editor`. `EditorShell` owns sidebar open state. The project sidebar is absolutely positioned over the canvas, so opening it does not change canvas layout. `EditorDialog` applies theme tokens for title, description, and footer actions. `components/ui/dialog.tsx` stays unmodified.
- Project dialog state lives in `hooks/use-project-dialogs.ts`. Mock projects live in `components/editor/mock-projects.ts`. Slugs are derived with `toProjectSlug` and are not stored. Submitting a dialog does not persist anything.
- Project metadata lives in PostgreSQL through `src/prisma/db.ts`. `ownerId` stores the Clerk user ID. `canvasJsonPath` is the blob reference and stays empty until canvas storage exists.

## Session Notes

- The home page stays the plain Ghost AI screen, with auth controls in the top-right. The editor chrome is mounted at `/editor`, and the same controls sit in the navbar.
- Verified the navbar toggle, sidebar slide, both empty tab states, and close button in the browser. Typecheck and lint passed.
- Closing the project sidebar from its close button returns focus to the navbar toggle.
- Clerk keys live in `.env.local`, which is gitignored. Do not commit them.
- Auth pages share `AuthScreen`. Large screens are half elevated panel and half base background. Small screens show the form only. Clerk uses the dark theme with Geist through CSS variables.
- Sign-in and sign-up always finish at `/editor`. A signed-in visit to `/` also goes to `/editor`; a signed-out visit goes to sign-in.
- `tsconfig.json` sets `baseUrl` so `@/` resolves from the project root, and `.claude` skill templates are excluded from the app typecheck.
- Project Clerk skills are pruned to `.claude/skills`: `clerk`, `clerk-nextjs-patterns`, `clerk-custom-ui`, `clerk-cli`, and `clerk-setup`. `skills-lock.json` lists only those five so a later skills update does not restore the rest.
- Verified the editor home, live slug preview, owned-project rename and delete actions, the shared-project list without actions, Enter-to-submit on rename, the destructive delete confirmation, the sidebar New Project button, and the mobile scrim. On a desktop width the scrim is hidden and the sidebar still overlays the canvas. Lint passed. Typecheck of the new editor files passed; an existing redirect typing error remains in the home route.
- `toProjectSlug` folds diacritics before slugifying. A nonblank name that still produces an empty slug keeps Create disabled and shows a validation message. `context/current-issues.md` stays local and is no longer tracked.
- Prisma 8 ORM init replaced the Prisma 7 client. The contract is `src/prisma/contract.prisma`, the runtime is `src/prisma/db.ts`, and `prisma.config.ts` points at that contract. `@prisma/client`, `@prisma/adapter-pg`, and `pg` are removed.
- `DATABASE_URL` lives in `.env.local` and is copied into `.env`, because `src/prisma/db.ts` loads `.env`. Both files are gitignored. The database is the existing Prisma Postgres instance at `pooled.db.prisma.io`. A temporary `create-db` instance (`proj_xesvkrx9cobmp289sbutnf1x`) was created first and can be left unclaimed.
- `prisma db init` on that existing database created `Project` and `ProjectCollaborator`, their indexes, the collaborator unique key, and the cascade foreign key, then signed the database. The dev ref is `migrations/app/refs/db.json`.
- Smoke query against that database printed one row, then deleted it:

```json
[
  {
    "canvasJsonPath": null,
    "createdAt": "2026-10-19 15:18:08.16872+00",
    "description": null,
    "id": "0dd7b05e-fc96-418b-989f-d5ba895a9320",
    "name": "Smoke project",
    "ownerId": "user_smoke_placeholder",
    "status": "DRAFT",
    "updatedAt": "2026-10-19 15:18:07.401+00"
  }
]
```

- The temporary smoke script was removed. `pnpm run build` compiles, then fails only on the existing `HomeGate` type error in `app/page.tsx` (`() => Promise<void>` is not a valid JSX component).
