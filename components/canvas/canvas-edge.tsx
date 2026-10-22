"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { useState, type MouseEvent } from "react";

import { EdgeLabel } from "@/components/canvas/edge-label";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export const canvasEdgeStyle = {
  stroke: "var(--text-muted)",
  strokeWidth: 1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const canvasEdgeActiveStyle = {
  ...canvasEdgeStyle,
  stroke: "var(--text-primary)",
} as const;

export function CanvasEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const label = typeof data?.label === "string" ? data.label : "";
  const emphasized = Boolean(selected) || hovered || editing;
  const strokeStyle = emphasized ? canvasEdgeActiveStyle : canvasEdgeStyle;

  function startEditing(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setEditing(true);
  }

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={startEditing}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          interactionWidth={32}
          style={{
            ...style,
            ...strokeStyle,
          }}
        />
      </g>
      <EdgeLabelRenderer>
        <EdgeLabel
          x={labelX}
          y={labelY}
          label={label}
          active={Boolean(selected) || editing}
          editing={editing}
          onEditingChange={setEditing}
          onChange={(next) => updateEdgeData(id, { label: next })}
        />
      </EdgeLabelRenderer>
    </>
  );
}
