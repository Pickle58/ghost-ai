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

export async function rejectIfAiRateLimited(
  userId: string,
): Promise<Response | null> {
  return aiRateLimitResponse(await countRecentAiTaskRuns(userId));
}
