import { jsonError } from "@/lib/http";
import { normalizeEmail } from "@/lib/email";
import {
  isCanvasSnapshot,
  readCanvasSnapshot,
  saveCanvasSnapshot,
} from "@/lib/canvas-storage";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";
import { db } from "@/src/prisma/db";

interface CanvasRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, context: CanvasRouteContext) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId } = await context.params;
  const projectResult = await authorizedProject(projectId, authResult.identity);

  if (projectResult.status === "not_found") {
    return jsonError("Not found", 404);
  }

  if (projectResult.status === "forbidden") {
    return jsonError("Forbidden", 403);
  }

  const canvas = (await readCanvasSnapshot(projectId)) ?? {
    nodes: [],
    edges: [],
  };

  return Response.json({ canvas });
}

export async function PUT(request: Request, context: CanvasRouteContext) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  if (!isCanvasSnapshot(bodyResult.body)) {
    return jsonError("Invalid canvas payload", 400);
  }

  const { projectId } = await context.params;
  const projectResult = await authorizedProject(projectId, authResult.identity);

  if (projectResult.status === "not_found") {
    return jsonError("Not found", 404);
  }

  if (projectResult.status === "forbidden") {
    return jsonError("Forbidden", 403);
  }

  try {
    const canvasUrl = await saveCanvasSnapshot(projectId, bodyResult.body);
    return Response.json({ canvasUrl }, { status: 200 });
  } catch (error) {
    console.error("Canvas save failed", error);
    return jsonError("Canvas save failed", 500);
  }
}

async function authorizedProject(projectId: string, identity: {
  userId: string;
  email: string;
}) {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project) {
    return { status: "not_found" as const };
  }

  if (project.ownerId === identity.userId) {
    return { status: "ok" as const, project };
  }

  const normalizedEmail = normalizeEmail(identity.email);
  if (normalizedEmail === "") {
    return { status: "forbidden" as const };
  }

  const collaborator = await db.orm.public.ProjectCollaborator.where({
    projectId,
    email: normalizedEmail,
  }).first();

  if (!collaborator) {
    return { status: "forbidden" as const };
  }

  return { status: "ok" as const, project };
}
