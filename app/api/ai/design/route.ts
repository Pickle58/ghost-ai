import { rejectIfAiRateLimited } from "@/lib/ai-rate-limit";
import { resolveDesignRunRequest } from "@/lib/design-request";
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

  const resolved = await resolveDesignRunRequest(
    bodyResult.body,
    authResult.identity,
    getAccessibleProject,
  );
  if (!resolved.ok) {
    if (resolved.status === 400) {
      return jsonError(resolved.error, 400);
    }

    const existing = await db.orm.public.Project.where({
      id: resolved.accessRoomId,
    }).first();
    return jsonError(
      existing ? "Forbidden" : "Project not found",
      existing ? 403 : 404,
    );
  }

  const rateLimited = await rejectIfAiRateLimited(authResult.identity.userId);
  if (rateLimited) {
    return rateLimited;
  }

  const runId = `design-${crypto.randomUUID()}`;

  await db.orm.public.TaskRun.create({
    runId,
    projectId: resolved.projectId,
    userId: authResult.identity.userId,
  });

  const queued = await designAgentTask({
    runId,
    projectId: resolved.projectId,
    roomId: resolved.roomId,
    prompt: resolved.prompt,
    userId: authResult.identity.userId,
  });

  return Response.json(
    {
      runId: queued.triggerRunId,
      publicToken: queued.publicToken,
    },
    { status: 202 },
  );
}
