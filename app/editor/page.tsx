import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { EditorWorkspace } from "@/components/editor/editor-workspace";
import { toProjectSummary } from "@/components/editor/project-summary";
import { getClerkIdentity } from "@/lib/project-access";
import { listOwnedProjects, listSharedProjects } from "@/lib/projects";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <EditorWorkspace ownedProjects={[]} sharedProjects={[]} />
      }
    >
      <EditorProjects />
    </Suspense>
  );
}

async function EditorProjects() {
  const { userId } = await auth.protect();
  if (!userId) {
    redirect(signInPath);
  }

  const identity = await getClerkIdentity();
  if (!identity) {
    redirect(signInPath);
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    listOwnedProjects(identity.userId),
    listSharedProjects(identity.email, identity.userId),
  ]);

  return (
    <EditorWorkspace
      ownedProjects={ownedProjects.map(toProjectSummary)}
      sharedProjects={sharedProjects.map(toProjectSummary)}
    />
  );
}
