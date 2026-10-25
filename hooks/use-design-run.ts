"use client";

import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { useCallback, useState } from "react";

interface DesignRunResponse {
  runId: string;
  publicToken: string;
}

interface DesignRunOutput {
  status: string;
  message: string;
}

export type DesignRunStartResult =
  | { ok: true }
  | { ok: false; error: string };

function parseDesignRunResponse(data: unknown): DesignRunResponse | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.runId !== "string" || record.runId.trim() === "") {
    return null;
  }
  if (typeof record.publicToken !== "string" || record.publicToken.trim() === "") {
    return null;
  }

  return {
    runId: record.runId,
    publicToken: record.publicToken,
  };
}

function parseDesignRunOutput(data: unknown): DesignRunOutput | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.status !== "string" || typeof record.message !== "string") {
    return null;
  }

  const message = record.message.trim();
  if (message === "") {
    return null;
  }

  return {
    status: record.status,
    message,
  };
}

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

type DesignRunStatus =
  | "PENDING_VERSION"
  | "QUEUED"
  | "DEQUEUED"
  | "EXECUTING"
  | "WAITING"
  | "DELAYED"
  | "COMPLETED"
  | "CANCELED"
  | "FAILED"
  | "CRASHED"
  | "SYSTEM_FAILURE"
  | "EXPIRED"
  | "TIMED_OUT";

function parseDesignRunStatus(status: string | undefined): DesignRunStatus | null {
  switch (status) {
    case "PENDING_VERSION":
    case "QUEUED":
    case "DEQUEUED":
    case "EXECUTING":
    case "WAITING":
    case "DELAYED":
    case "COMPLETED":
    case "CANCELED":
    case "FAILED":
    case "CRASHED":
    case "SYSTEM_FAILURE":
    case "EXPIRED":
    case "TIMED_OUT":
      return status;
    default:
      return null;
  }
}

export function isActiveRunStatus(status: string | undefined): boolean {
  const knownStatus = parseDesignRunStatus(status);

  if (!knownStatus) {
    return true;
  }

  switch (knownStatus) {
    case "PENDING_VERSION":
    case "QUEUED":
    case "DEQUEUED":
    case "EXECUTING":
    case "WAITING":
    case "DELAYED":
      return true;
    case "COMPLETED":
    case "CANCELED":
    case "FAILED":
    case "CRASHED":
    case "SYSTEM_FAILURE":
    case "EXPIRED":
    case "TIMED_OUT":
      return false;
    default: {
      const _exhaustive: never = knownStatus;
      return _exhaustive;
    }
  }
}

export function getDesignRunSettlement(input: {
  status: string | undefined;
  output: unknown;
  errorMessage?: string;
}): { ok: boolean; message: string } | null {
  if (isActiveRunStatus(input.status)) {
    return null;
  }

  const output = parseDesignRunOutput(input.output);
  const failedByOutput = output?.status === "failed";
  const failedByStatus = input.status !== "COMPLETED";

  if (failedByOutput || failedByStatus) {
    return {
      ok: false,
      message:
        output?.message
        ?? input.errorMessage
        ?? "The design run failed.",
    };
  }

  return {
    ok: true,
    message: output?.message ?? "AI Architect completed the design update.",
  };
}

export function useDesignRun() {
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const { run, error } = useRealtimeRun(runId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: Boolean(runId && publicToken),
    skipColumns: ["payload"],
  });

  const isRunActive =
    isStarting || (Boolean(runId && publicToken) && isActiveRunStatus(run?.status));

  const startDesignRun = useCallback(async (
    prompt: string,
    roomId: string,
  ): Promise<DesignRunStartResult> => {
    setIsStarting(true);

    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, roomId }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          error: readApiError(data) ?? "Could not start the design run.",
        };
      }

      const parsed = parseDesignRunResponse(data);
      if (!parsed) {
        return {
          ok: false,
          error: "The design run did not return a run id.",
        };
      }

      setRunId(parsed.runId);
      setPublicToken(parsed.publicToken);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Could not start the design run.",
      };
    } finally {
      setIsStarting(false);
    }
  }, []);

  const resetDesignRun = useCallback(() => {
    setRunId(null);
    setPublicToken(null);
  }, []);

  return {
    runId,
    publicToken,
    run,
    error,
    isRunActive,
    startDesignRun,
    resetDesignRun,
  };
}
