# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor workspace

## Current Goal

- Owners can invite and remove collaborators from the workspace share dialog, and collaborators can view that list. Liveblocks setup is next.

## Completed

- Design system: shadcn/ui configured with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea. `lucide-react` is installed. `lib/utils.ts` exports `cn()`. Theme tokens in `app/globals.css` drive the dark palette, and shadcn semantic colors alias those tokens.
- Editor chrome: fixed-height navbar with a sidebar toggle, an overlay project sidebar, and a reusable dialog pattern. The sidebar has My Projects and Shared tabs and a full-width New Project button.
- Clerk: `@clerk/nextjs` and `@clerk/ui` are installed. `ClerkProvider` wraps the app inside `<body>` with the shadcn theme. `proxy.ts` runs `clerkMiddleware()`. Sign-in and sign-up routes exist. Sign-in, sign-up, and the user button render on the home screen and in the editor navbar. The project is linked to the existing Ghost AI Clerk application. Routes stay public until each page calls `await auth.protect()`.
- Project dialogs: `/editor` centers a home prompt with a New Project button. Create, rename, and delete dialogs are wired from that button and from the sidebar. Owned projects show rename and delete; shared projects do not. The create dialog shows a live slug. A mobile scrim closes the sidebar. Dialog state started in `useProjectDialogs` with mock projects.
- Prisma 8 data layer: `src/prisma/contract.prisma` defines `Project`, `ProjectCollaborator`, and `ProjectStatus` only. `ownerId` is the Clerk user ID as text. IDs are `String @id @default(uuid())`. Collaborator delete cascades from the project. Timestamps are `TimestamptzString` and `temporal.updatedAtString()`. Slugs are not stored. `prisma contract emit` and `prisma db init` succeeded against PostgreSQL. `src/prisma/db.ts` is the only runtime.
- Project APIs: `GET` and `POST /api/projects`, plus `PATCH` and `DELETE /api/projects/[projectId]`. The signed-in Clerk user id is `ownerId`. A missing or blank create name becomes `Untitled Project`. Unsigned requests return 401. Another user's project returns 403. A missing project returns 404.
- Editor home wiring: `/editor` is a server component. It loads owned projects with `listOwnedProjects` and shared projects with `listSharedProjects`, then passes both lists to the sidebar. `useProjectActions` owns the dialogs and calls the project API. Create builds a room ID from the slug plus a short unique suffix, stores that ID as the project ID, and navigates to `/editor/[roomId]`. Rename refreshes the home list. Delete refreshes it, or redirects to `/editor` when the deleted project is the active workspace. Shared projects have no rename or delete actions. Mock project data is gone.
- Editor workspace shell: `/editor/[roomId]` is a server component. Unsigned visits redirect to sign-in. Missing and unauthorized projects render `AccessDenied`. `lib/project-access.ts` resolves the Clerk user id and verified email, then allows the owner or a matching collaborator. The workspace shows the project name, a share button, an AI sidebar toggle, the project sidebar with the current room highlighted, a dark canvas placeholder, and a right-hand AI placeholder. The canvas fills the remaining viewport. Canvas, Liveblocks, and AI chat behavior are not wired yet.
- Share dialog: the navbar Share button opens the dialog. Owners invite by email, remove collaborators, and copy the project link with temporary `Copied!` feedback. Collaborators see the list only. `GET`, `POST`, and `DELETE /api/projects/[projectId]/collaborators` enforce this. Invite and remove require the owner. Emails are stored lowercase on `ProjectCollaborator`. Clerk Backend API adds a display name and avatar when a user exists; otherwise the row shows the email only. A successful invite also creates a Clerk application invitation, which sends the invitation email. Inviting the same address again sends another email. There is no local user table.

## In Progress

- None yet.

## Next Up

- Set up Liveblocks (`10-liveblocks-setup.md`). Do not start that slice until asked.
- Decide sign-up and sign-in identifiers and social providers.
- Protect individual pages and Server Actions with `await auth.protect()` when those routes need a signed-in user. Project API routes return 401 from `auth()` instead, because `auth.protect()` redirects.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Generated `components/ui/*` files stay as installed. Dark theme alignment lives in `app/globals.css`.
- The app is dark only. `:root` and `.dark` use the same palette, and `<html>` carries the `dark` class so component `dark:` styles apply.
- shadcn uses the `base-nova` style (Base UI). `cn()` is the `cn` package, re-exported from `lib/utils.ts`.
- Editor chrome lives in `components/editor`. `EditorShell` owns sidebar open state. The project sidebar is absolutely positioned over the canvas, so opening it does not change canvas layout. `EditorDialog` applies theme tokens for title, description, and footer actions. `components/ui/dialog.tsx` stays unmodified.
- Project dialog state and mutations live in `hooks/use-project-actions.ts`. The create dialog previews a room ID from `toRoomId`: the slugified name plus a 6-character suffix. That room ID is the project ID and the future Liveblocks room ID. `POST /api/projects` accepts this id when it matches the room ID shape; omitted ids still use the schema UUID default. A taken id returns 409. Slugs are not a separate column.
- Project metadata lives in PostgreSQL through `src/prisma/db.ts`. `ownerId` stores the Clerk user ID. `canvasJsonPath` is the blob reference and stays empty until canvas storage exists.
- Project mutations check `id` and `ownerId` together. A miss is then classified: no row is 404, a row owned by someone else is 403. Lists are newest `createdAt` first, then `id`. Rename rejects a missing or blank name. Create accepts a room ID only when the caller sends one; otherwise the schema UUID default still applies. The caller cannot set `ownerId`.
- Workspace access is decided in `lib/project-access.ts`. The identity is the Clerk user id plus a verified email: the verified primary address, otherwise another verified address. A missing project and a project the user cannot access both render `AccessDenied`. The AI sidebar is an overlay placeholder, same as the project sidebar, so it does not resize the canvas.
- Collaborator emails are trimmed and lowercased before they are stored or matched. Invite and remove check `ownerId` on the server. Listing is allowed for the owner or a matching collaborator. Names and avatars come from Clerk at read time and are not stored. An invite of the owner's own verified email is rejected because that person already has access. Invite emails are Clerk application invitations (`notify: true`). The link uses Clerk's sign-up path, and `<SignUp>` already sends new users to `/editor`, where a matching collaborator email opens the shared project. Access is stored even when Clerk cannot send the email, and the dialog says so. Inviting an address that already has access sends the email again.

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
- ESLint ignores generated Prisma types: `migrations/snapshots/**` and `src/prisma/contract.d.ts`. Hand-edited files under `migrations/app/` stay linted.
- `HomeGate` now returns `null` after `redirect()`, so the home route typechecks. Behavior is unchanged: a signed-in visit still goes to `/editor`, and a signed-out visit still goes to sign-in.
- Project API smoke test created a row, confirmed the owner could list and rename it, confirmed a second user id got `forbidden` for rename and delete, then deleted the row. A later delete and rename of that id returned `not_found`.
- Unsigned `GET`, `POST`, `PATCH`, and `DELETE` against the production server each returned `401` with `{ "error": "Unauthorized" }`.
- `pnpm run build` passes. `export const runtime` is not allowed on these routes while `cacheComponents` is enabled, so the handlers use the default runtime.
- Verified the wired editor home with a temporary Clerk test user, then deleted that user. A signed-out visit to `/editor` redirects to sign-in. The empty owned and shared lists render. Creating "Checkout Service" previewed `checkout-service-opfqox`, `POST /api/projects` returned 201, and the browser navigated to `/editor/checkout-service-opfqox`. That workspace route is still a 404 until the workspace shell exists. Returning to `/editor` listed the project. Rename to "Payments Service" updated the sidebar after `PATCH` 200. Delete showed the project name, `DELETE` returned 200, and the list refreshed to empty. `pnpm run build` passes.
- Opening `/editor` in development prints a `pg` SSL mode warning from the database connection. Next.js shows it in the dev overlay. The page still returns 200.
- Shared project lookup uses only a verified Clerk email: the verified primary address, otherwise another verified address, otherwise no shared projects. `createOwnedProject` still pre-checks a caller-supplied id, and a primary-key race (`SqlQueryError`, SQL state `23505`) returns `conflict` instead of failing the request. Other database errors still propagate.
- The editor loading shell does not call `usePathname`. With cache components enabled, a dynamic room route cannot prerender a suspense fallback that reads the URL.
- Verified the workspace shell with a temporary Clerk test user, then deleted that user and the projects created for the check. A signed-out visit to `/editor/[roomId]` redirects to sign-in. A missing room and a project owned by someone else both show AccessDenied, with a link back to `/editor`, and do not show the project name. Adding the test email as a collaborator opened that project, highlighted it on the Shared tab, and showed no rename or delete actions. The owner workspace showed the project name, share button, AI toggle, centered canvas message, and the current room highlighted in the sidebar. Opening the AI sidebar left the canvas message in place. At a 390px width the shell filled the viewport without horizontal scroll. `pnpm run build` passes.
- Verified the share dialog with two temporary Clerk users, then deleted those users and the project. The owner dialog invited an unknown email as email-only and a Clerk user as "Blair Nguyen" with a Clerk avatar. Removing that user from the dialog left "No collaborators yet." The collaborator saw the project on the Shared tab, opened a dialog with the name and avatar, and had no invite, remove, or copy controls. Their invite and remove requests returned 403. Unsigned list, invite, and remove requests returned 401. `pnpm run build` passes. The automated browser blocked clipboard writes, so the `Copied!` state was not shown there; a failed copy shows "Could not copy the link."
- Collaborator invites now send a Clerk invitation email. The dialog shows "Invitation sent." when Clerk accepts the invitation, and "The invitation email could not be sent. Try again." when it does not. Submitting an address that is already on the project sends the email again. The existing collaborator on `test-project-l20osx` was sent an invitation; Clerk returned a pending invitation for that address.
