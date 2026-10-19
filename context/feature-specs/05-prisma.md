# Prisma Schema And Data Layer

## Goal

Prisma 8 is installed. Replace the starter contract with the project data models, then apply the first database migration.

## Models

Edit `src/prisma/contract.prisma`.

Add `Project`:

- owner ID mapped to Clerk user
- name
- optional description
- status enum: `DRAFT`, `ARCHIVED`
- `canvasJsonPath` for future canvas blob storage
- timestamps
- indexes on owner ID and creation date

Add `ProjectCollaborator`:

- project relation with cascade delete
- collaborator email
- creation timestamp
- unique constraint on project/email
- indexes on email and project/date

Do not add extra fields unless required by Prisma.

Use Prisma 8 PSL. Set `onDelete: Cascade` on the collaborator relation. Store timestamps as `TimestamptzString`, because this app runs on Node 24, which has no global `Temporal`. Declare the status enum with a Prisma 8 `enum` block.

After editing the contract, run `pnpm exec prisma contract emit`.

## Prisma Client

The runtime entry is `src/prisma/db.ts`. It exports `db` from `@prisma/orm-postgres/runtime`, loaded with the emitted contract and `DATABASE_URL`.

Import `db` from `@/src/prisma/db` at server boundaries. Do not add a second client in `lib/prisma.ts`.

## Migration

Set `DATABASE_URL` to PostgreSQL 15 or newer, then apply the contract with `pnpm exec prisma db init` for the first database. Later contract changes go through `prisma migration plan` and `prisma db migrate`.

## Dependencies

Installed:

- `prisma`
- `@prisma/orm-postgres`
- `@prisma/cli-engine`
- `dotenv`

`@prisma/client`, `@prisma/adapter-pg`, and `pg` are not part of this client.

`prebuild` runs `prisma contract emit` so `next build` has a current contract. Next.js has no Prisma emit plugin.

## Check When Done

- the contract has both models with correct relations and indexes
- `src/prisma/db.ts` exports one `db` instance
- the first migration has been applied
- `pnpm run build` passes
