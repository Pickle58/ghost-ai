"use client";

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, type DragEvent } from "react";

import { CanvasControlBar } from "@/components/canvas/canvas-control-bar";
import {
  CanvasEdgeView,
  canvasEdgeStyle,
} from "@/components/canvas/canvas-edge";
import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { ShapePanel } from "@/components/canvas/shape-panel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  createDroppedCanvasNode,
  parseShapeDragPayload,
  SHAPE_DRAG_MIME,
} from "@/lib/shape-drag";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const initialNodes: CanvasNode[] = [];
const initialEdges: CanvasEdge[] = [];

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeView,
};

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeView,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  style: canvasEdgeStyle,
  data: {
    label: "",
  },
};

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasSurface />
    </ReactFlowProvider>
  );
}

function FlowCanvasSurface() {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = reactFlow;
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: initialNodes },
      edges: { initial: initialEdges },
    });

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({
    reactFlow,
    undo,
    redo,
  });

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ duration: 200 });
  }, [fitView]);

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

  function handleConnect(connection: Connection) {
    onConnect({
      ...defaultEdgeOptions,
      ...connection,
    });
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
        onConnect={handleConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={canvasEdgeStyle}
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
      <CanvasControlBar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
}
