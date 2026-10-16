# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Design system

## Current Goal

- Design system primitives are in place. Pick the next feature unit.

## Completed

- Design system: shadcn/ui configured with Button, Card, Dialog, Input, Tabs, Textarea, and ScrollArea. `lucide-react` is installed. `lib/utils.ts` exports `cn()`. Theme tokens in `app/globals.css` drive the dark palette, and shadcn semantic colors alias those tokens.

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

## Session Notes

- Verified typecheck, lint, and `cn()` class merging.
- The home page stays the plain Ghost AI screen on the dark theme. The installed primitives are not rendered there.
