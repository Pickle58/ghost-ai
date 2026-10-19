import { collaboratorEmail } from "@/lib/collaborator-body";
import {
  inviteCollaborator,
  listCollaborators,
  type CollaboratorInvite,
  type CollaboratorList,
} from "@/lib/collaborators";
import { jsonError } from "@/lib/http";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";

interface CollaboratorsRouteContext {
  params: Promise<{ projectId: string }>;
}

function listResponse(result: CollaboratorList): Response {
  switch (result.status) {
    case "ok":
      return Response.json({ collaborators: result.collaborators });
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

function inviteResponse(result: CollaboratorInvite): Response {
  switch (result.status) {
    case "ok":
      return Response.json(
        { collaborator: result.collaborator, emailSent: result.emailSent },
        { status: result.created ? 201 : 200 },
      );
    case "not_found":
      return jsonError("Not found", 404);
    case "forbidden":
      return jsonError("Forbidden", 403);
    case "owner":
      return jsonError("You already have access", 400);
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext,
) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId } = await context.params;
  const result = await listCollaborators(projectId, authResult.identity);
  return listResponse(result);
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext,
) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const emailResult = collaboratorEmail(bodyResult.body);
  if (!emailResult.ok) {
    return emailResult.response;
  }

  const { projectId } = await context.params;
  const result = await inviteCollaborator(
    projectId,
    authResult.identity.userId,
    emailResult.email,
    authResult.identity.email,
  );
  return inviteResponse(result);
}
