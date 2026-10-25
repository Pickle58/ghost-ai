import { auth } from "@trigger.dev/sdk";

import { jsonError } from "@/lib/http";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";
import { db } from "@/src/prisma/db";
import { generateSpecTokenRequestSchema } from "@/types/spec-generation";

export async function POST(request: Request) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const parsed = generateSpecTokenRequestSchema.safeParse(bodyResult.body);
  if (!parsed.success) {
    return jsonError("runId is required", 400);
  }

  const { runId } = parsed.data;
  const run = await db.orm.public.TaskRun.where({ runId }).first();
  if (!run) {
    return jsonError("Run not found", 404);
  }

  if (run.userId !== authResult.identity.userId) {
    return jsonError("Forbidden", 403);
  }

  const token = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [run.runId],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token, runId: run.runId });
}
