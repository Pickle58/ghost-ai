import {
  removeCollaborator,
  type CollaboratorRemoval,
} from "@/lib/collaborators";
import { jsonError } from "@/lib/http";
import { requireIdentity } from "@/lib/require-user";

interface CollaboratorRouteContext {
  params: Promise<{ projectId: string; collaboratorId: string }>;
}

function removalResponse(result: CollaboratorRemoval): Response {
  switch (result.status) {
    case "ok":
      return Response.json({ collaborator: result.collaborator });
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

export async function DELETE(
  _request: Request,
  context: CollaboratorRouteContext,
) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId, collaboratorId } = await context.params;
  const result = await removeCollaborator(
    projectId,
    authResult.identity.userId,
    collaboratorId,
  );
  return removalResponse(result);
}
