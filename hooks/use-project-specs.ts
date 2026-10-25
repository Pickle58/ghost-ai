"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { specListPath } from "@/lib/spec-api";

export interface ProjectSpecItem {
  id: string;
  createdAt: string;
  filename: string;
}

export function useProjectSpecs(projectId: string, enabled: boolean) {
  const [specs, setSpecs] = useState<ProjectSpecItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasEnabled, setWasEnabled] = useState(enabled);
  const [refreshId, setRefreshId] = useState(0);
  const loadGeneration = useRef(0);

  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (enabled) {
      setIsLoading(true);
      setError(null);
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const generation = ++loadGeneration.current;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(specListPath(projectId), { signal });
        if (isStaleLoad(signal, generation, loadGeneration.current)) {
          return;
        }

        if (!response.ok) {
          const message = await readErrorMessage(response);
          if (isStaleLoad(signal, generation, loadGeneration.current)) {
            return;
          }

          setSpecs([]);
          setError(message);
          return;
        }

        const nextSpecs = await readSpecs(response);
        if (isStaleLoad(signal, generation, loadGeneration.current)) {
          return;
        }

        if (!nextSpecs) {
          setSpecs([]);
          setError("Something went wrong. Try again.");
          return;
        }

        setSpecs(nextSpecs);
      } catch (caught) {
        if (
          isStaleLoad(signal, generation, loadGeneration.current)
          || isAbortError(caught)
        ) {
          return;
        }

        setError("Something went wrong. Try again.");
      } finally {
        if (!isStaleLoad(signal, generation, loadGeneration.current)) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [enabled, projectId, refreshId]);

  const reload = useCallback(() => {
    setRefreshId((current) => current + 1);
  }, []);

  return {
    specs,
    isLoading,
    error,
    reload,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isStaleLoad(
  signal: AbortSignal,
  generation: number,
  currentGeneration: number,
): boolean {
  return signal.aborted || generation !== currentGeneration;
}

async function readSpecs(response: Response): Promise<ProjectSpecItem[] | null> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.specs)) {
      return null;
    }

    const specs: ProjectSpecItem[] = [];
    for (const item of body.specs) {
      const spec = parseSpec(item);
      if (!spec) {
        return null;
      }

      specs.push(spec);
    }

    return specs;
  } catch {
    return null;
  }
}

function parseSpec(value: unknown): ProjectSpecItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }

  if (typeof value.createdAt !== "string" || value.createdAt.trim() === "") {
    return null;
  }

  if (typeof value.filename !== "string" || value.filename.trim() === "") {
    return null;
  }

  return {
    id: value.id,
    createdAt: value.createdAt,
    filename: value.filename,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      isRecord(body)
      && typeof body.error === "string"
      && body.error.trim() !== ""
    ) {
      return body.error;
    }
  } catch {
    return "Something went wrong. Try again.";
  }

  return "Something went wrong. Try again.";
}
