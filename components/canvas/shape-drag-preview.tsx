"use client";

import { createPortal } from "react-dom";

import { NodeShapeGraphic } from "@/components/canvas/node-shape";
import { DEFAULT_NODE_COLOR, type NodeShape } from "@/types/canvas";

export interface ShapeDragGhostState {
  shape: NodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
}

export function ShapeDragGhost({
  shape,
  width,
  height,
  x,
  y,
}: ShapeDragGhostState) {
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 opacity-75 **:pointer-events-none"
      style={{ left: x, top: y, width, height }}
    >
      <NodeShapeGraphic
        shape={shape}
        fill={DEFAULT_NODE_COLOR.fill}
        interactive={false}
      />
    </div>,
    document.body,
  );
}
