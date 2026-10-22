import { jsonError } from "@/lib/http";
import { getAccessibleProject } from "@/lib/project-access";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";
import { db } from "@/src/prisma/db";
import { designAgentTask } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const prompt = typeof bodyResult.body?.prompt === "string"
    ? bodyResult.body.prompt.trim()
    : "";
  const projectId = typeof bodyResult.body?.projectId === "string"
    ? bodyResult.body.projectId
    : "";
  const roomId = typeof bodyResult.body?.roomId === "string"
    ? bodyResult.body.roomId
    : projectId;

  if (!prompt || !projectId) {
    return jsonError("Prompt and projectId are required", 400);
  }

  const project = await getAccessibleProject(projectId, authResult.identity);
  if (!project) {
    const existing = await db.orm.public.Project.where({ id: projectId }).first();
    return jsonError(existing ? "Forbidden" : "Project not found", existing ? 403 : 404);
  }

  const runId = `design-${crypto.randomUUID()}`;

  await db.orm.public.TaskRun.create({
    runId,
    projectId,
    userId: authResult.identity.userId,
  });

  await designAgentTask({
    runId,
    projectId,
    roomId,
    prompt,
    userId: authResult.identity.userId,
  });

  return Response.json(
    {
      runId,
      projectId,
      roomId,
      status: "queued",
    },
    { status: 202 },
  );
}
