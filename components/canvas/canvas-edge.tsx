"use client";

import { BezierEdge, type EdgeProps } from "@xyflow/react";

import type { CanvasEdge } from "@/types/canvas";

export const canvasEdgeStyle = {
  stroke: "var(--text-primary)",
  strokeWidth: 1,
} as const;

export function CanvasEdgeView(props: EdgeProps<CanvasEdge>) {
  return (
    <BezierEdge
      {...props}
      markerEnd={undefined}
      markerStart={undefined}
      style={{
        ...props.style,
        ...canvasEdgeStyle,
      }}
    />
  );
}
