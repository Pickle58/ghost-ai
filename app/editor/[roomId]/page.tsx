import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorRoom } from "@/components/editor/editor-room";
import { toProjectSummary } from "@/components/editor/project-summary";
import { getAccessibleProject, getClerkIdentity } from "@/lib/project-access";
import { listOwnedProjects, listSharedProjects } from "@/lib/projects";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function EditorRoomPage({ params }: EditorRoomPageProps) {
  return (
    <Suspense fallback={<div className="h-dvh bg-base" />}>
      <EditorRoomContent params={params} />
    </Suspense>
  );
}

async function EditorRoomContent({ params }: EditorRoomPageProps) {
  const { userId } = await auth.protect();
  if (!userId) {
    redirect(signInPath);
  }

  const identity = await getClerkIdentity();
  if (!identity) {
    redirect(signInPath);
  }

  const { roomId } = await params;
  const project = await getAccessibleProject(roomId, identity);
  if (!project) {
    return <AccessDenied />;
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    listOwnedProjects(identity.userId),
    listSharedProjects(identity.email, identity.userId),
  ]);

  return (
    <EditorRoom
      project={toProjectSummary(project)}
      canManage={project.ownerId === identity.userId}
      ownedProjects={ownedProjects.map(toProjectSummary)}
      sharedProjects={sharedProjects.map(toProjectSummary)}
    />
  );
}
