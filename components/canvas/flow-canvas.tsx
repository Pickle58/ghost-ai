"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DragEvent } from "react";

import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import {
  createDroppedCanvasNode,
  parseShapeDragPayload,
  SHAPE_DRAG_MIME,
} from "@/lib/shape-drag";
import { CANVAS_NODE_TYPE, type CanvasEdge, type CanvasNode } from "@/types/canvas";

const initialNodes: CanvasNode[] = [];
const initialEdges: CanvasEdge[] = [];

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeView,
};

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasSurface />
    </ReactFlowProvider>
  );
}

function FlowCanvasSurface() {
  const { screenToFlowPosition } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: initialNodes },
      edges: { initial: initialEdges },
    });

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const payload = parseShapeDragPayload(
      event.dataTransfer.getData(SHAPE_DRAG_MIME),
    );

    if (!payload) {
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    onNodesChange([
      {
        type: "add",
        item: createDroppedCanvasNode(payload, position),
      },
    ]);
  }

  return (
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--border-subtle)"
          bgColor="var(--bg-base)"
        />
        <MiniMap
          bgColor="var(--bg-elevated)"
          maskColor="color-mix(in srgb, var(--bg-base) 70%, transparent)"
          nodeColor="var(--border-subtle)"
          nodeStrokeColor="var(--text-muted)"
          maskStrokeColor="var(--accent-primary)"
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
