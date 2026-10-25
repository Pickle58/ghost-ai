"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useCallback, useState } from "react";

import { isActiveRunStatus } from "@/hooks/use-design-run";
import type { GenerateSpecRequest } from "@/types/spec-generation";

export type SpecRunStartResult =
  | { ok: true }
  | { ok: false; error: string };

function readApiError(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.error !== "string") {
    return null;
  }

  const message = record.error.trim();
  return message === "" ? null : message;
}

function parseSpecStartResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.runId !== "string" || record.runId.trim() === "") {
    return null;
  }

  return record.runId;
}

function parseSpecTokenResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.token !== "string" || record.token.trim() === "") {
    return null;
  }

  return record.token;
}

export function useSpecRun() {
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { run, error } = useRealtimeRun(runId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: Boolean(runId && publicToken),
    skipColumns: ["payload"],
  });

  const isRunActive =
    isStarting
    || (Boolean(runId && publicToken) && isActiveRunStatus(run?.status));

  const startSpecRun = useCallback(async (
    input: GenerateSpecRequest,
  ): Promise<SpecRunStartResult> => {
    setIsStarting(true);

    try {
      const startResponse = await fetch("/api/ai/spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const startData: unknown = await startResponse.json().catch(() => null);

      if (!startResponse.ok) {
        return {
          ok: false,
          error: readApiError(startData) ?? "Could not start spec generation.",
        };
      }

      const nextRunId = parseSpecStartResponse(startData);
      if (!nextRunId) {
        return {
          ok: false,
          error: "Spec generation did not return a run id.",
        };
      }

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ runId: nextRunId }),
      });

      const tokenData: unknown = await tokenResponse.json().catch(() => null);

      if (!tokenResponse.ok) {
        return {
          ok: false,
          error: readApiError(tokenData) ?? "Could not track spec generation.",
        };
      }

      const token = parseSpecTokenResponse(tokenData);
      if (!token) {
        return {
          ok: false,
          error: "Spec generation did not return a tracking token.",
        };
      }

      setRunId(nextRunId);
      setPublicToken(token);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Could not start spec generation.",
      };
    } finally {
      setIsStarting(false);
    }
  }, []);

  const resetSpecRun = useCallback(() => {
    setRunId(null);
    setPublicToken(null);
  }, []);

  return {
    runId,
    publicToken,
    run,
    error,
    isRunActive,
    startSpecRun,
    resetSpecRun,
  };
}
