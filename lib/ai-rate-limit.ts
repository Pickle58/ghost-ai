import { jsonError } from "@/lib/http";
import { db } from "@/src/prisma/db";

export const AI_RATE_LIMIT_MAX_RUNS = 10;
export const AI_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const AI_RATE_LIMIT_ERROR = "Too many AI requests";

export function aiRateWindowStart(now = Date.now()): string {
  return new Date(now - AI_RATE_LIMIT_WINDOW_MS).toISOString();
}

export async function countRecentAiTaskRuns(userId: string): Promise<number> {
  const since = aiRateWindowStart();
  const totals = await db.orm.public.TaskRun.where((run) => run.userId.eq(userId))
    .where((run) => run.createdAt.gte(since))
    .aggregate((aggregate) => ({
      total: aggregate.count(),
    }));

  return totals.total;
}

export function aiRateLimitResponse(recentRunCount: number): Response | null {
  if (recentRunCount >= AI_RATE_LIMIT_MAX_RUNS) {
    return jsonError(AI_RATE_LIMIT_ERROR, 429);
  }

  return null;
}

export function aiRateLimitResponseAfterReservation(
  recentRunCount: number,
): Response | null {
  if (recentRunCount > AI_RATE_LIMIT_MAX_RUNS) {
    return jsonError(AI_RATE_LIMIT_ERROR, 429);
  }

  return null;
}

export interface AiRateLimitAllowed {
  ok: true;
  reservationId: string;
}

export interface AiRateLimitRejected {
  ok: false;
  response: Response;
}

export async function rejectIfAiRateLimited(
  userId: string,
  projectId: string,
): Promise<AiRateLimitAllowed | AiRateLimitRejected> {
  const reservationId = crypto.randomUUID();
  await db.orm.public.TaskRun.create({
    id: reservationId,
    runId: `ai-reserve-${reservationId}`,
    projectId,
    userId,
  });

  const limited = aiRateLimitResponseAfterReservation(
    await countRecentAiTaskRuns(userId),
  );
  if (limited) {
    await db.orm.public.TaskRun.where({ id: reservationId }).delete();
    return { ok: false, response: limited };
  }

  return { ok: true, reservationId };
}

export async function bindAiRateLimitReservation(
  reservationId: string,
  runId: string,
): Promise<void> {
  await db.orm.public.TaskRun.where({ id: reservationId }).update({ runId });
}

export async function releaseAiRateLimitReservation(
  reservationId: string,
): Promise<void> {
  await db.orm.public.TaskRun.where({ id: reservationId }).delete();
}
