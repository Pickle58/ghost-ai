import {
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZES,
  NODE_SHAPES,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

export const SHAPE_DRAG_MIME = "application/x-ghost-shape";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

interface FlowPosition {
  x: number;
  y: number;
}

let nextNodeSerial = 0;

export function shapeDragPayload(shape: NodeShape): ShapeDragPayload {
  const size = DEFAULT_NODE_SIZES[shape];

  return {
    shape,
    width: size.width,
    height: size.height,
  };
}

export function serializeShapeDragPayload(payload: ShapeDragPayload): string {
  return JSON.stringify(payload);
}

export function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  if (!raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (!isNodeShape(record.shape)) {
    return null;
  }

  const expected = DEFAULT_NODE_SIZES[record.shape];

  if (record.width !== expected.width || record.height !== expected.height) {
    return null;
  }

  return {
    shape: record.shape,
    width: expected.width,
    height: expected.height,
  };
}

export function createCanvasNodeId(shape: NodeShape, now = Date.now()): string {
  nextNodeSerial += 1;

  return `${shape}-${now}-${nextNodeSerial}`;
}

export function createDroppedCanvasNode(
  payload: ShapeDragPayload,
  position: FlowPosition,
): CanvasNode {
  return {
    id: createCanvasNodeId(payload.shape),
    type: CANVAS_NODE_TYPE,
    position,
    width: payload.width,
    height: payload.height,
    initialWidth: payload.width,
    initialHeight: payload.height,
    data: {
      label: "",
      color: DEFAULT_NODE_COLOR.fill,
      shape: payload.shape,
    },
  };
}

function isNodeShape(value: unknown): value is NodeShape {
  return (
    typeof value === "string" &&
    (NODE_SHAPES as readonly string[]).includes(value)
  );
}
