import type { Models } from "@/src/prisma/contract";
import { db } from "@/src/prisma/db";

export type ProjectRecord = Models.public_Project;

export type OwnedMutation =
  | { status: "ok"; project: ProjectRecord }
  | { status: "not_found" }
  | { status: "forbidden" };

export async function listOwnedProjects(
  ownerId: string,
): Promise<ProjectRecord[]> {
  return db.orm.public.Project.where({ ownerId })
    .orderBy([
      (project) => project.createdAt.desc(),
      (project) => project.id.desc(),
    ])
    .all();
}

export async function listSharedProjects(
  email: string,
  ownerId: string,
): Promise<ProjectRecord[]> {
  const normalizedEmail = email.trim();
  if (normalizedEmail === "") {
    return [];
  }

  const memberships = await db.orm.public.ProjectCollaborator.where({
    email: normalizedEmail,
  })
    .include("project")
    .all();

  return memberships
    .map((membership) => membership.project)
    .filter((project) => project.ownerId !== ownerId)
    .sort(compareNewestFirst);
}

export async function createOwnedProject(
  ownerId: string,
  name: string,
  id?: string,
): Promise<{ status: "ok"; project: ProjectRecord } | { status: "conflict" }> {
  if (id) {
    const existing = await db.orm.public.Project.where({ id }).first();
    if (existing) {
      return { status: "conflict" };
    }
  }

  const project = await db.orm.public.Project.create({
    ownerId,
    name,
    ...(id ? { id } : {}),
  });

  return { status: "ok", project };
}

export async function renameOwnedProject(
  projectId: string,
  ownerId: string,
  name: string,
): Promise<OwnedMutation> {
  const project = await db.orm.public.Project.where({ id: projectId })
    .where({ ownerId })
    .update({ name });

  if (project) {
    return { status: "ok", project };
  }

  return classifyMissingProject(projectId);
}

export async function deleteOwnedProject(
  projectId: string,
  ownerId: string,
): Promise<OwnedMutation> {
  const project = await db.orm.public.Project.where({ id: projectId })
    .where({ ownerId })
    .delete();

  if (project) {
    return { status: "ok", project };
  }

  return classifyMissingProject(projectId);
}

async function classifyMissingProject(
  projectId: string,
): Promise<Exclude<OwnedMutation, { status: "ok" }>> {
  const existing = await db.orm.public.Project.where({ id: projectId }).first();

  if (!existing) {
    return { status: "not_found" };
  }

  return { status: "forbidden" };
}

function compareNewestFirst(a: ProjectRecord, b: ProjectRecord): number {
  if (a.createdAt === b.createdAt) {
    if (a.id === b.id) {
      return 0;
    }

    return a.id < b.id ? 1 : -1;
  }

  return a.createdAt < b.createdAt ? 1 : -1;
}
