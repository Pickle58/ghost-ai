# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Authentication

## Current Goal

- Clerk is installed and linked. Confirm sign-in from the home screen and editor navbar.

## Completed

- Design system: shadcn/ui configured with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea. `lucide-react` is installed. `lib/utils.ts` exports `cn()`. Theme tokens in `app/globals.css` drive the dark palette, and shadcn semantic colors alias those tokens.
- Editor chrome: fixed-height navbar with a sidebar toggle, an overlay project sidebar, and a reusable dialog pattern. The sidebar lists My Projects and Shared as empty states and includes a full-width New Project button. No product dialogs are built yet.
- Clerk: `@clerk/nextjs` and `@clerk/ui` are installed. `ClerkProvider` wraps the app inside `<body>` with the shadcn theme. `proxy.ts` runs `clerkMiddleware()`. Sign-in and sign-up routes exist. Sign-in, sign-up, and the user button render on the home screen and in the editor navbar. The project is linked to the existing Ghost AI Clerk application. Routes stay public until each page calls `await auth.protect()`.

## In Progress

- None yet.

## Next Up

- Decide sign-up and sign-in identifiers and social providers.
- Protect individual pages, Route Handlers, and Server Actions with `await auth.protect()` when those routes need a signed-in user.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Generated `components/ui/*` files stay as installed. Dark theme alignment lives in `app/globals.css`.
- The app is dark only. `:root` and `.dark` use the same palette, and `<html>` carries the `dark` class so component `dark:` styles apply.
- shadcn uses the `base-nova` style (Base UI). `cn()` is the `cn` package, re-exported from `lib/utils.ts`.
- Editor chrome lives in `components/editor`. `EditorShell` owns sidebar open state. The project sidebar is absolutely positioned over the canvas, so opening it does not change canvas layout. `EditorDialog` applies theme tokens for title, description, and footer actions. `components/ui/dialog.tsx` stays unmodified.

## Session Notes

- The home page stays the plain Ghost AI screen, with auth controls in the top-right. The editor chrome is mounted at `/editor`, and the same controls sit in the navbar.
- Verified the navbar toggle, sidebar slide, both empty tab states, and close button in the browser. Typecheck and lint passed.
- Closing the project sidebar from its close button returns focus to the navbar toggle.
- Clerk keys live in `.env.local`, which is gitignored. Do not commit them.
