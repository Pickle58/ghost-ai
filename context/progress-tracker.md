# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor chrome

## Current Goal

- Editor navbar, floating project sidebar, and dialog pattern are in place. Pick the next feature unit.

## Completed

- Design system: shadcn/ui configured with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea. `lucide-react` is installed. `lib/utils.ts` exports `cn()`. Theme tokens in `app/globals.css` drive the dark palette, and shadcn semantic colors alias those tokens.
- Editor chrome: fixed-height navbar with a sidebar toggle, an overlay project sidebar, and a reusable dialog pattern. The sidebar lists My Projects and Shared as empty states and includes a full-width New Project button. No product dialogs are built yet.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Generated `components/ui/*` files stay as installed. Dark theme alignment lives in `app/globals.css`.
- The app is dark only. `:root` and `.dark` use the same palette, and `<html>` carries the `dark` class so component `dark:` styles apply.
- shadcn uses the `base-nova` style (Base UI). `cn()` is the `cn` package, re-exported from `lib/utils.ts`.
- Editor chrome lives in `components/editor`. `EditorShell` owns sidebar open state. The project sidebar is absolutely positioned over the canvas, so opening it does not change canvas layout. `EditorDialog` applies theme tokens for title, description, and footer actions. `components/ui/dialog.tsx` stays unmodified.

## Session Notes

- The home page stays the plain Ghost AI screen. The editor chrome is mounted at `/editor`.
- Verified the navbar toggle, sidebar slide, both empty tab states, and close button in the browser. Typecheck and lint passed.
- Closing the project sidebar from its close button returns focus to the navbar toggle.
