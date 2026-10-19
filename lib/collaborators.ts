import { clerkClient } from "@clerk/nextjs/server";

import { sendCollaboratorInvitation } from "@/lib/collaborator-invitation";
import { normalizeEmail } from "@/lib/email";
import {
  getAccessibleProject,
  type ClerkIdentity,
} from "@/lib/project-access";
import { db } from "@/src/prisma/db";

export interface CollaboratorView {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

interface CollaboratorProfile {
  name: string | null;
  imageUrl: string | null;
}

interface CollaboratorRow {
  id: string;
  email: string;
}

export type CollaboratorList =
  | { status: "ok"; collaborators: CollaboratorView[] }
  | { status: "not_found" }
  | { status: "forbidden" };

export type CollaboratorInvite =
  | {
      status: "ok";
      collaborator: CollaboratorView;
      emailSent: boolean;
      created: boolean;
    }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "owner" };

export type CollaboratorRemoval =
  | { status: "ok"; collaborator: { id: string; email: string } }
  | { status: "not_found" }
  | { status: "forbidden" };

const CLERK_USER_PAGE = 100;

export async function listCollaborators(
  projectId: string,
  identity: ClerkIdentity,
): Promise<CollaboratorList> {
  const project = await getAccessibleProject(projectId, identity);
  if (!project) {
    return classifyMissingProject(projectId);
  }

  const rows = await db.orm.public.ProjectCollaborator.where({ projectId })
    .orderBy([
      (collaborator) => collaborator.createdAt.asc(),
      (collaborator) => collaborator.id.asc(),
    ])
    .all();

  const profiles = await profilesByEmail(rows.map((row) => row.email));

  return {
    status: "ok",
    collaborators: rows.map((row) => toView(row, profiles.get(normalizeEmail(row.email)))),
  };
}

export async function inviteCollaborator(
  projectId: string,
  ownerId: string,
  email: string,
  ownerEmail: string,
): Promise<CollaboratorInvite> {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project) {
    return { status: "not_found" };
  }

  if (project.ownerId !== ownerId) {
    return { status: "forbidden" };
  }

  if (ownerEmail !== "" && email === ownerEmail) {
    return { status: "owner" };
  }

  const existing = await db.orm.public.ProjectCollaborator.where({ projectId })
    .where({ email })
    .first();
  if (existing) {
    return finishInvite(existing, false);
  }

  try {
    const created = await db.orm.public.ProjectCollaborator.create({
      projectId,
      email,
    });
    return finishInvite(created, true);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const raced = await db.orm.public.ProjectCollaborator.where({ projectId })
      .where({ email })
      .first();
    if (!raced) {
      throw error;
    }

    return finishInvite(raced, false);
  }
}

async function finishInvite(
  row: CollaboratorRow,
  created: boolean,
): Promise<CollaboratorInvite> {
  const emailSent = await sendCollaboratorInvitation(row.email);
  const profiles = await profilesByEmail([row.email]);

  return {
    status: "ok",
    collaborator: toView(row, profiles.get(normalizeEmail(row.email))),
    emailSent,
    created,
  };
}

export async function removeCollaborator(
  projectId: string,
  ownerId: string,
  collaboratorId: string,
): Promise<CollaboratorRemoval> {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project) {
    return { status: "not_found" };
  }

  if (project.ownerId !== ownerId) {
    return { status: "forbidden" };
  }

  const collaborator = await db.orm.public.ProjectCollaborator.where({
    id: collaboratorId,
  })
    .where({ projectId })
    .delete();

  if (!collaborator) {
    return { status: "not_found" };
  }

  return {
    status: "ok",
    collaborator: { id: collaborator.id, email: collaborator.email },
  };
}

async function classifyMissingProject(
  projectId: string,
): Promise<Exclude<CollaboratorList, { status: "ok" }>> {
  const existing = await db.orm.public.Project.where({ id: projectId }).first();
  if (!existing) {
    return { status: "not_found" };
  }

  return { status: "forbidden" };
}

function toView(
  row: CollaboratorRow,
  profile: CollaboratorProfile | undefined,
): CollaboratorView {
  return {
    id: row.id,
    email: row.email,
    name: profile?.name ?? null,
    imageUrl: profile?.imageUrl ?? null,
  };
}

async function profilesByEmail(
  emails: readonly string[],
): Promise<Map<string, CollaboratorProfile>> {
  const wanted = [
    ...new Set(emails.map(normalizeEmail).filter((email) => email !== "")),
  ];
  const profiles = new Map<string, CollaboratorProfile>();
  if (wanted.length === 0) {
    return profiles;
  }

  try {
    const client = await clerkClient();

    for (let index = 0; index < wanted.length; index += CLERK_USER_PAGE) {
      const batch = wanted.slice(index, index + CLERK_USER_PAGE);
      try {
        await collectProfiles(client, batch, profiles);
      } catch {
        // This batch stays email-only when Clerk is unavailable.
      }
    }
  } catch {
    return profiles;
  }

  return profiles;
}

async function collectProfiles(
  client: Awaited<ReturnType<typeof clerkClient>>,
  batch: string[],
  profiles: Map<string, CollaboratorProfile>,
): Promise<void> {
  const wanted = new Set(batch);
  let offset = 0;

  while (offset < CLERK_USER_PAGE * 5) {
    const response = await client.users.getUserList({
      emailAddress: batch,
      limit: CLERK_USER_PAGE,
      offset,
    });

    for (const user of response.data) {
      const profile = profileFromUser(user);
      for (const address of user.emailAddresses) {
        const email = normalizeEmail(address.emailAddress);
        if (wanted.has(email)) {
          profiles.set(email, profile);
        }
      }
    }

    const nextOffset = offset + response.data.length;
    if (response.data.length === 0 || nextOffset >= response.totalCount) {
      return;
    }

    offset = nextOffset;
  }
}

function profileFromUser(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
}): CollaboratorProfile {
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(" ")
    .trim();
  const username = user.username?.trim() ?? "";
  let name: string | null = null;
  if (fullName !== "") {
    name = fullName;
  } else if (username !== "") {
    name = username;
  }

  return {
    name,
    imageUrl: httpsUrl(user.imageUrl),
  };
}

function httpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!Object.hasOwn(error, "kind") || !Object.hasOwn(error, "sqlState")) {
    return false;
  }

  const queryError = error as { kind: unknown; sqlState: unknown };
  return queryError.kind === "sql_query" && queryError.sqlState === "23505";
}
