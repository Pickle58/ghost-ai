"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "saving" | "saved" | "error";

export interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled?: boolean;
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
  debounceMs = 600,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("saved");
  const lastPayloadRef = useRef<string | null>(null);

  const saveCanvas = useCallback(async () => {
    if (!enabled || !projectId) {
      return;
    }

    const payload = JSON.stringify({ nodes, edges });
    setStatus("saving");

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/canvas`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
        },
      );

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = { status: response.status, statusText: response.statusText };
        }

        console.error("Canvas save failed", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error("Canvas save failed");
      }

      lastPayloadRef.current = payload;
      setStatus("saved");
    } catch (error) {
      console.error("Canvas autosave request failed", error);
      setStatus("error");
    }
  }, [enabled, edges, nodes, projectId]);

  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    const payload = JSON.stringify({ nodes, edges });
    if (lastPayloadRef.current === payload) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveCanvas();
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [debounceMs, edges, enabled, nodes, projectId, saveCanvas]);

  return {
    status,
    saveNow: saveCanvas,
  };
}
