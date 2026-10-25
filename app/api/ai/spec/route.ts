import { tasks } from "@trigger.dev/sdk";

import { rejectIfAiRateLimited } from "@/lib/ai-rate-limit";
import { jsonError } from "@/lib/http";
import { getAccessibleProject } from "@/lib/project-access";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";
import { db } from "@/src/prisma/db";
import { generateSpecRequestSchema } from "@/types/spec-generation";
import type { generateSpec } from "@/trigger/generate-spec";

export async function POST(request: Request) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parsed = generateSpecRequestSchema.safeParse(bodyResult.body);
  if (!parsed.success) {
    return jsonError("roomId and chatHistory are required", 400);
  }

  const { roomId, chatHistory } = parsed.data;
  const project = await getAccessibleProject(roomId, authResult.identity);
  if (!project) {
    const existing = await db.orm.public.Project.where({ id: roomId }).first();
    return jsonError(
      existing ? "Forbidden" : "Project not found",
      existing ? 403 : 404,
    );
  }

  const rateLimited = await rejectIfAiRateLimited(authResult.identity.userId);
  if (rateLimited) {
    return rateLimited;
  }

  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
  });

  await db.orm.public.TaskRun.create({
    runId: handle.id,
    projectId: project.id,
    userId: authResult.identity.userId,
  });

  return Response.json({ runId: handle.id }, { status: 202 });
}
