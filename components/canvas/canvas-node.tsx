"use client";

import {
  Handle,
  NodeResizeControl,
  Position,
  useConnection,
  useReactFlow,
  type ControlPosition,
  type NodeProps,
} from "@xyflow/react";

import { NodeLabel } from "@/components/canvas/node-label";
import { NodeShapeGraphic } from "@/components/canvas/node-shape";
import { cn } from "@/lib/utils";
import {
  DEFAULT_NODE_SIZES,
  MIN_NODE_SIZE,
  nodeTextColor,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const RESIZE_HANDLES: ControlPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const CONNECTION_HANDLES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

const HANDLE_DOT = {
  width: 6,
  height: 6,
  borderRadius: 9999,
  backgroundColor: "var(--text-primary)",
  borderColor: "var(--bg-elevated)",
  borderStyle: "solid",
  borderWidth: 1,
} as const;

const RESIZE_HANDLE_STYLE = {
  ...HANDLE_DOT,
  zIndex: 2,
} as const;

export function CanvasNodeView({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const connecting = useConnection((connection) => connection.inProgress);
  const fallback = DEFAULT_NODE_SIZES[data.shape];

  return (
    <div
      className="group relative"
      style={{
        width: positiveSize(width, fallback.width),
        height: positiveSize(height, fallback.height),
      }}
    >
      <NodeShapeGraphic shape={data.shape} fill={data.color} />
      {selected ? <SelectionOutline /> : null}
      <NodeLabel
        label={data.label}
        color={nodeTextColor(data.color)}
        onChange={(label) => updateNodeData(id, { label })}
      />
      {selected
        ? RESIZE_HANDLES.map((position) => (
            <NodeResizeControl
              key={position}
              position={position}
              minWidth={MIN_NODE_SIZE.width}
              minHeight={MIN_NODE_SIZE.height}
              style={RESIZE_HANDLE_STYLE}
            />
          ))
        : null}
      {CONNECTION_HANDLES.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={handle.position}
          className={cn(
            "opacity-0 transition-opacity group-hover:opacity-100",
            (selected || connecting) && "opacity-100",
          )}
          style={{ ...HANDLE_DOT, zIndex: 3 }}
        />
      ))}
    </div>
  );
}

function SelectionOutline() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ boxShadow: "0 0 0 1px var(--text-muted)" }}
    />
  );
}

function positiveSize(
  value: number | null | undefined,
  fallback: number,
): number {
  return typeof value === "number" && value > 0 ? value : fallback;
}
