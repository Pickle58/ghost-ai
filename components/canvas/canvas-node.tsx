"use client";

import { type NodeProps } from "@xyflow/react";

import { NodeShapeGraphic } from "@/components/canvas/node-shape";
import { DEFAULT_NODE_SIZES, type CanvasNode } from "@/types/canvas";

export function CanvasNodeView({
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const fallback = DEFAULT_NODE_SIZES[data.shape];

  return (
    <div
      style={{
        width: positiveSize(width, fallback.width),
        height: positiveSize(height, fallback.height),
      }}
    >
      <NodeShapeGraphic
        shape={data.shape}
        fill={data.color}
        selected={selected}
        label={data.label}
      />
    </div>
  );
}

function positiveSize(
  value: number | null | undefined,
  fallback: number,
): number {
  return typeof value === "number" && value > 0 ? value : fallback;
}
