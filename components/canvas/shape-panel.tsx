"use client";

import { useReactFlow } from "@xyflow/react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from "react";

import {
  ShapeDragGhost,
  type ShapeDragGhostState,
} from "@/components/canvas/shape-drag-preview";
import {
  serializeShapeDragPayload,
  SHAPE_DRAG_MIME,
  shapeDragPayload,
} from "@/lib/shape-drag";
import { NODE_SHAPES, type NodeShape } from "@/types/canvas";

const SHAPE_ICONS: Record<NodeShape, LucideIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

export function ShapePanel() {
  const { getViewport } = useReactFlow();
  const getViewportRef = useRef(getViewport);
  const dragShapeRef = useRef<NodeShape | null>(null);
  const [preview, setPreview] = useState<ShapeDragGhostState | null>(null);

  getViewportRef.current = getViewport;

  useEffect(() => {
    function onDragOver(event: globalThis.DragEvent) {
      const shape = dragShapeRef.current;
      const point = cursorPoint(event);

      if (!shape || !point) {
        return;
      }

      setPreview(ghostAt(shape, point, getViewportRef.current().zoom));
    }

    function onDragEnd() {
      dragShapeRef.current = null;
      setPreview(null);
    }

    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("dragend", onDragEnd, true);

    return () => {
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("dragend", onDragEnd, true);
    };
  }, []);

  function startShapeDrag(
    event: ReactDragEvent<HTMLButtonElement>,
    shape: NodeShape,
  ) {
    const payload = shapeDragPayload(shape);

    event.dataTransfer.setData(
      SHAPE_DRAG_MIME,
      serializeShapeDragPayload(payload),
    );
    event.dataTransfer.effectAllowed = "copy";
    hideNativeDragImage(event.dataTransfer);

    dragShapeRef.current = shape;
    setPreview(
      ghostAt(
        shape,
        { x: event.clientX, y: event.clientY },
        getViewport().zoom,
      ),
    );
  }

  return (
    <>
      <div
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-elevated px-2 py-2"
        onDragOver={keepDropOffPanel}
        onDrop={keepDropOffPanel}
      >
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape];

          return (
            <button
              key={shape}
              type="button"
              draggable
              aria-label={`Drag ${shape} onto the canvas`}
              title={shape}
              className="flex size-8 cursor-grab items-center justify-center rounded-xl text-copy-secondary hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
              onDragStart={(event) => startShapeDrag(event, shape)}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </div>
      {preview ? <ShapeDragGhost {...preview} /> : null}
    </>
  );
}

function ghostAt(
  shape: NodeShape,
  point: { x: number; y: number },
  zoom: number,
): ShapeDragGhostState {
  const payload = shapeDragPayload(shape);
  const scale = zoom > 0 ? zoom : 1;

  return {
    shape: payload.shape,
    width: payload.width * scale,
    height: payload.height * scale,
    x: point.x,
    y: point.y,
  };
}

function cursorPoint(event: { clientX: number; clientY: number }) {
  if (event.clientX === 0 && event.clientY === 0) {
    return null;
  }

  return { x: event.clientX, y: event.clientY };
}

function hideNativeDragImage(dataTransfer: DataTransfer) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  dataTransfer.setDragImage(canvas, 0, 0);
}

function keepDropOffPanel(event: ReactDragEvent<HTMLDivElement>) {
  event.stopPropagation();
}
