import { APICallError, RetryError } from "ai";

export const PRIMARY_SPEC_MODEL = "gemini-3.8-flash";
export const FALLBACK_SPEC_MODEL = "gemini-3.7-flash";
export const SPEC_CAPACITY_BACKOFF_SECONDS = [20, 45] as const;

const CAPACITY_STATUS_CODES = new Set([429, 503, 529]);
const CAPACITY_MESSAGE =
  /overloaded|unavailable|resource.?exhausted|high demand|too many requests|try again later/i;
const DAILY_QUOTA_MESSAGE =
  /exceeded your current quota|per day limit exceeded|free.?tier|please retry in \d+h/i;

export interface CapacityRetryEvent {
  modelId: string;
  attempt: number;
  waitSeconds: number;
  fallback: boolean;
}

export interface GenerateWithCapacityRetryDeps<T> {
  generate: (modelId: string) => Promise<T>;
  wait: (seconds: number) => Promise<void>;
  onRetry?: (event: CapacityRetryEvent) => void;
}

export function isDailyQuotaError(error: unknown): boolean {
  if (RetryError.isInstance(error)) {
    return (
      isDailyQuotaError(error.lastError) ||
      error.errors.some((nested) => isDailyQuotaError(nested))
    );
  }

  return error instanceof Error && DAILY_QUOTA_MESSAGE.test(error.message);
}

export function isProviderCapacityError(error: unknown): boolean {
  if (isDailyQuotaError(error)) {
    return false;
  }

  if (RetryError.isInstance(error)) {
    return (
      isProviderCapacityError(error.lastError) ||
      error.errors.some((nested) => isProviderCapacityError(nested))
    );
  }

  if (APICallError.isInstance(error)) {
    if (error.statusCode != null && CAPACITY_STATUS_CODES.has(error.statusCode)) {
      return true;
    }
    return CAPACITY_MESSAGE.test(error.message);
  }

  return error instanceof Error && CAPACITY_MESSAGE.test(error.message);
}

export async function generateWithCapacityRetry<T>(
  deps: GenerateWithCapacityRetryDeps<T>,
): Promise<{ value: T; modelId: string }> {
  const models = [PRIMARY_SPEC_MODEL, FALLBACK_SPEC_MODEL];
  let lastError: unknown;

  for (const [modelIndex, modelId] of models.entries()) {
    for (let attempt = 0; attempt <= SPEC_CAPACITY_BACKOFF_SECONDS.length; attempt += 1) {
      try {
        return {
          value: await deps.generate(modelId),
          modelId,
        };
      } catch (error) {
        lastError = error;
        if (!isProviderCapacityError(error)) {
          throw error;
        }

        if (attempt < SPEC_CAPACITY_BACKOFF_SECONDS.length) {
          const waitSeconds = SPEC_CAPACITY_BACKOFF_SECONDS[attempt];
          deps.onRetry?.({
            modelId,
            attempt: attempt + 1,
            waitSeconds,
            fallback: false,
          });
          await deps.wait(waitSeconds);
          continue;
        }

        const fallbackModel = models[modelIndex + 1];
        if (fallbackModel) {
          deps.onRetry?.({
            modelId: fallbackModel,
            attempt: 1,
            waitSeconds: 0,
            fallback: true,
          });
          break;
        }

        throw error;
      }
    }
  }

  throw lastError;
}
