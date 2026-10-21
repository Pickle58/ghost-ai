import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode" as const;
export const CANVAS_EDGE_TYPE = "canvasEdge" as const;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export type NodeColor = (typeof NODE_COLORS)[number];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];
export const DEFAULT_NODE_SHAPE: NodeShape = "rectangle";

export const DEFAULT_NODE_SIZES: Record<
  NodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 200, height: 88 },
  diamond: { width: 148, height: 148 },
  circle: { width: 104, height: 104 },
  pill: { width: 200, height: 64 },
  cylinder: { width: 128, height: 112 },
  hexagon: { width: 140, height: 124 },
};

export const MIN_NODE_SIZE = {
  width: 64,
  height: 48,
} as const;

export function nodeTextColor(fill: string): string {
  for (const color of NODE_COLORS) {
    if (color.fill === fill) {
      return color.text;
    }
  }

  return DEFAULT_NODE_COLOR.text;
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: NodeColor["fill"];
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<Record<string, unknown>, typeof CANVAS_EDGE_TYPE>;
