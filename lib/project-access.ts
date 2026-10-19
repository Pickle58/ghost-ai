import { auth, currentUser } from "@clerk/nextjs/server";

import { normalizeEmail } from "@/lib/email";
import type { ProjectRecord } from "@/lib/projects";
import { db } from "@/src/prisma/db";

export interface ClerkIdentity {
  userId: string;
  email: string;
}

export async function getClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  return {
    userId,
    email: primaryVerifiedEmail(user),
  };
}

export async function getAccessibleProject(
  projectId: string,
  identity: ClerkIdentity,
): Promise<ProjectRecord | null> {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project) {
    return null;
  }

  if (project.ownerId === identity.userId) {
    return project;
  }

  const email = normalizeEmail(identity.email);
  if (email === "") {
    return null;
  }

  const membership = await db.orm.public.ProjectCollaborator.where({
    projectId,
  })
    .where({ email })
    .first();

  if (!membership) {
    return null;
  }

  return project;
}

function primaryVerifiedEmail(
  user: Awaited<ReturnType<typeof currentUser>>,
): string {
  const verifiedEmails =
    user?.emailAddresses?.filter(
      (address) => address.verification?.status === "verified",
    ) ?? [];

  return normalizeEmail(
    verifiedEmails.find((address) => address.id === user?.primaryEmailAddressId)
      ?.emailAddress ??
      verifiedEmails[0]?.emailAddress ??
      "",
  );
}
