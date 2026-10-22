"use client";

import {
  Maximize,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DragEvent } from "react";

export interface CanvasControlBarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlBarProps) {
  function keepDropOffBar(event: DragEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="nodrag nopan nowheel absolute bottom-6 left-6 z-10 flex items-center gap-1 rounded-full border border-surface-border bg-elevated px-2 py-2"
      onDragOver={keepDropOffBar}
      onDrop={keepDropOffBar}
    >
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out (-)"
        onClick={onZoomOut}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:scale-95"
      >
        <ZoomOut className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Fit view"
        title="Fit view"
        onClick={onFitView}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:scale-95"
      >
        <Maximize className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in (+)"
        onClick={onZoomIn}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:scale-95"
      >
        <ZoomIn className="size-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-surface-border" />

      <button
        type="button"
        aria-label="Undo"
        title="Undo (⌘Z / Ctrl+Z)"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Undo2 className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Redo"
        title="Redo (⌘⇧Z / Ctrl+Y)"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Redo2 className="size-4" />
      </button>
    </div>
  );
}
