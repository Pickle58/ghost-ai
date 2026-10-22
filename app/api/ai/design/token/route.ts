import { jsonError } from "@/lib/http";
import { requireIdentity } from "@/lib/require-user";
import { readJsonBody } from "@/lib/project-body";
import { db } from "@/src/prisma/db";
import { createDesignRunToken } from "@/trigger/design-agent";

export async function POST(request: Request) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const runId = typeof bodyResult.body?.runId === "string" ? bodyResult.body.runId : "";
  if (!runId) {
    return jsonError("runId is required", 400);
  }

  const run = await db.orm.public.TaskRun.where({ runId }).first();
  if (!run) {
    return jsonError("Run not found", 404);
  }

  if (run.userId !== authResult.identity.userId) {
    return jsonError("Forbidden", 403);
  }

  const token = createDesignRunToken({
    runId: run.runId,
    projectId: run.projectId,
    userId: run.userId,
  });

  return Response.json({ token, runId: run.runId });
}
