import { jsonError } from "@/lib/http";
import { projectNameForRename, readJsonBody } from "@/lib/project-body";
import {
  deleteOwnedProject,
  renameOwnedProject,
  type OwnedMutation,
} from "@/lib/projects";
import { requireUserId } from "@/lib/require-user";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

function ownedMutationResponse(result: OwnedMutation): Response {
  switch (result.status) {
    case "ok":
      return Response.json({ project: result.project });
    case "not_found":
      return jsonError("Not found", 404);
    case "forbidden":
      return jsonError("Forbidden", 403);
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const authResult = await requireUserId();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const nameResult = projectNameForRename(bodyResult.body);
  if (!nameResult.ok) {
    return nameResult.response;
  }

  const { projectId } = await context.params;
  const result = await renameOwnedProject(
    projectId,
    authResult.userId,
    nameResult.name,
  );
  return ownedMutationResponse(result);
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const authResult = await requireUserId();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId } = await context.params;
  const result = await deleteOwnedProject(projectId, authResult.userId);
  return ownedMutationResponse(result);
}
