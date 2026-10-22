"use client";

import type { useReactFlow } from "@xyflow/react";
import { useEffect } from "react";

export interface UseKeyboardShortcutsOptions {
  reactFlow: ReturnType<typeof useReactFlow>;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (isMod && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (isMod && event.shiftKey && event.key.toLowerCase() === "z") ||
        (isMod && !event.shiftKey && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault();
        redo();
        return;
      }

      // Zoom in: + or = (standalone or with Cmd/Ctrl)
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        reactFlow.zoomIn({ duration: 200 });
        return;
      }

      // Zoom out: - or _ (standalone or with Cmd/Ctrl)
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        reactFlow.zoomOut({ duration: 200 });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactFlow, undo, redo]);
}
