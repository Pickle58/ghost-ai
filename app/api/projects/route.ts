import { jsonError } from "@/lib/http";
import {
  projectIdForCreate,
  projectNameForCreate,
  readJsonBody,
} from "@/lib/project-body";
import { createOwnedProject, listOwnedProjects } from "@/lib/projects";
import { requireUserId } from "@/lib/require-user";

export async function GET() {
  const authResult = await requireUserId();
  if (!authResult.ok) {
    return authResult.response;
  }

  const projects = await listOwnedProjects(authResult.userId);
  return Response.json({ projects });
}

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const nameResult = projectNameForCreate(bodyResult.body);
  if (!nameResult.ok) {
    return nameResult.response;
  }

  const idResult = projectIdForCreate(bodyResult.body);
  if (!idResult.ok) {
    return idResult.response;
  }

  const result = await createOwnedProject(
    authResult.userId,
    nameResult.name,
    idResult.id ?? undefined,
  );

  switch (result.status) {
    case "ok":
      return Response.json({ project: result.project }, { status: 201 });
    case "conflict":
      return jsonError("A project with this room ID already exists", 409);
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}
