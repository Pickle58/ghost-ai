import { tasks } from "@trigger.dev/sdk";

import {
  bindAiRateLimitReservation,
  rejectIfAiRateLimited,
  releaseAiRateLimitReservation,
} from "@/lib/ai-rate-limit";
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

  const rateLimited = await rejectIfAiRateLimited(
    authResult.identity.userId,
    project.id,
  );
  if (!rateLimited.ok) {
    return rateLimited.response;
  }

  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
    });

    await bindAiRateLimitReservation(rateLimited.reservationId, handle.id);

    return Response.json({ runId: handle.id }, { status: 202 });
  } catch (error) {
    await releaseAiRateLimitReservation(rateLimited.reservationId).catch(() => undefined);
    throw error;
  }
}
