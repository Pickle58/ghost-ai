"use client";

import type { useReactFlow } from "@xyflow/react";
import { useEffect, useRef } from "react";

export interface UseKeyboardShortcutsOptions {
  reactFlow: ReturnType<typeof useReactFlow>;
  undo: () => void;
  redo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toUpperCase();
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [contenteditable='']",
    ),
  );
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions,
): void;
export function useKeyboardShortcuts(
  reactFlow: ReturnType<typeof useReactFlow>,
  undo: () => void,
  redo: () => void,
): void;
export function useKeyboardShortcuts(
  reactFlowOrOptions:
    | UseKeyboardShortcutsOptions
    | ReturnType<typeof useReactFlow>,
  maybeUndo?: () => void,
  maybeRedo?: () => void,
): void {
  const options: UseKeyboardShortcutsOptions =
    "reactFlow" in reactFlowOrOptions
      ? (reactFlowOrOptions as UseKeyboardShortcutsOptions)
      : {
          reactFlow: reactFlowOrOptions as ReturnType<typeof useReactFlow>,
          undo: maybeUndo!,
          redo: maybeRedo!,
        };

  const reactFlowRef = useRef(options.reactFlow);
  const undoRef = useRef(options.undo);
  const redoRef = useRef(options.redo);

  useEffect(() => {
    reactFlowRef.current = options.reactFlow;
    undoRef.current = options.undo;
    redoRef.current = options.redo;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      // Undo: Cmd/Ctrl + Z (without Shift)
      if (
        isMod &&
        !event.shiftKey &&
        !event.altKey &&
        (event.key.toLowerCase() === "z" || event.code === "KeyZ")
      ) {
        event.preventDefault();
        undoRef.current();
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (isMod &&
          event.shiftKey &&
          !event.altKey &&
          (event.key.toLowerCase() === "z" || event.code === "KeyZ")) ||
        (isMod &&
          !event.shiftKey &&
          !event.altKey &&
          (event.key.toLowerCase() === "y" || event.code === "KeyY"))
      ) {
        event.preventDefault();
        redoRef.current();
        return;
      }

      // Zoom in: + or = (standalone or with Cmd/Ctrl)
      if (
        !event.altKey &&
        (event.key === "+" ||
          event.key === "=" ||
          event.code === "NumpadAdd" ||
          event.code === "Equal")
      ) {
        event.preventDefault();
        reactFlowRef.current.zoomIn({ duration: 200 });
        return;
      }

      // Zoom out: - (standalone or with Cmd/Ctrl)
      if (
        !event.altKey &&
        (event.key === "-" ||
          event.key === "_" ||
          event.code === "NumpadSubtract" ||
          event.code === "Minus")
      ) {
        event.preventDefault();
        reactFlowRef.current.zoomOut({ duration: 200 });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
