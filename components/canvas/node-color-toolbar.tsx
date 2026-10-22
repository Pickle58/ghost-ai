"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type NodeColor } from "@/types/canvas";

interface NodeColorToolbarProps {
  activeFill: NodeColor["fill"];
  onSelect: (fill: NodeColor["fill"]) => void;
}

export function NodeColorToolbar({
  activeFill,
  onSelect,
}: NodeColorToolbarProps) {
  return (
    <NodeToolbar
      isVisible
      position={Position.Top}
      offset={12}
      className="nodrag nopan nowheel"
      onPointerDown={stopCanvasGesture}
    >
      <div
        role="group"
        aria-label="Node color"
        className="flex items-center gap-1 rounded-full border border-surface-border bg-elevated px-1.5 py-1"
      >
        {NODE_COLORS.map((color) => {
          const active = color.fill === activeFill;

          return (
            <button
              key={color.fill}
              type="button"
              aria-label={`Apply ${color.fill} node color`}
              aria-pressed={active}
              className={cn(
                "size-4 shrink-0 rounded-full nodrag nopan nowheel",
                "transition-[box-shadow] duration-150",
                active
                  ? "shadow-[0_0_0_1.5px_currentColor] hover:shadow-[0_0_0_1.5px_currentColor,0_0_4px_0_currentColor]"
                  : "shadow-[0_0_0_1px_var(--border-subtle)] hover:shadow-[0_0_4px_0_currentColor]",
              )}
              style={{
                backgroundColor: color.fill,
                color: color.text,
              }}
              onClick={() => onSelect(color.fill)}
            />
          );
        })}
      </div>
    </NodeToolbar>
  );
}

function stopCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
  event.stopPropagation();
}
