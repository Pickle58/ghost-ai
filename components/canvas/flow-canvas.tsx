"use client";

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
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
  useEdges,
  useNodes,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  useCallback,
  useEffect,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";

import { CanvasControlBar } from "@/components/canvas/canvas-control-bar";
import {
  CanvasEdgeView,
  canvasEdgeStyle,
} from "@/components/canvas/canvas-edge";
import { CanvasNodeView } from "@/components/canvas/canvas-node";
import { CanvasParticipantAvatars } from "@/components/canvas/canvas-participant-avatars";
import { LiveCursors } from "@/components/canvas/live-cursors";
import { ShapePanel } from "@/components/canvas/shape-panel";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { useCanvasAutosave } from "@/hooks/use-canvas-autosave";
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

function isCanvasSnapshot(value: unknown): value is { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return Array.isArray(record.nodes) && Array.isArray(record.edges);
}

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeView,
};

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeView,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  style: canvasEdgeStyle,
  markerEnd: {
    type: "arrowclosed",
    color: "var(--text-muted)",
  },
  data: {
    label: "",
  },
};

interface FlowCanvasProps {
  projectId: string;
  isTemplatesOpen?: boolean;
  onOpenTemplatesChange?: (open: boolean) => void;
  isAiOpen?: boolean;
  onSaveStatusChange?: (status: "saving" | "saved" | "error") => void;
  onSaveReady?: (saveNow: () => Promise<void>) => void;
}

export function FlowCanvas({
  projectId,
  isTemplatesOpen,
  onOpenTemplatesChange,
  isAiOpen,
  onSaveStatusChange,
  onSaveReady,
}: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasSurface
        projectId={projectId}
        isTemplatesOpen={isTemplatesOpen}
        onOpenTemplatesChange={onOpenTemplatesChange}
        isAiOpen={isAiOpen}
        onSaveStatusChange={onSaveStatusChange}
        onSaveReady={onSaveReady}
      />
    </ReactFlowProvider>
  );
}

interface FlowCanvasSurfaceProps {
  projectId: string;
  isTemplatesOpen?: boolean;
  onOpenTemplatesChange?: (open: boolean) => void;
  isAiOpen?: boolean;
  onSaveStatusChange?: (status: "saving" | "saved" | "error") => void;
  onSaveReady?: (saveNow: () => Promise<void>) => void;
}

function FlowCanvasSurface({
  projectId,
  isTemplatesOpen,
  onOpenTemplatesChange,
  isAiOpen,
  onSaveStatusChange,
  onSaveReady,
}: FlowCanvasSurfaceProps) {
  const reactFlow = useReactFlow();
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = reactFlow;
  const updateMyPresence = useUpdateMyPresence();
  const [hasLoadedInitialCanvas, setHasLoadedInitialCanvas] = useState(false);
  const selectedNodes = useNodes<CanvasNode>().filter((node) => node.selected);
  const selectedEdges = useEdges<CanvasEdge>().filter((edge) => edge.selected);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: initialNodes },
      edges: { initial: initialEdges },
    });

  const { status, saveNow } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: hasLoadedInitialCanvas,
  });

  useEffect(() => {
    onSaveStatusChange?.(status);
  }, [onSaveStatusChange, status]);

  useEffect(() => {
    onSaveReady?.(saveNow);
  }, [onSaveReady, saveNow]);

  useEffect(() => {
    if (!projectId || hasLoadedInitialCanvas) {
      return;
    }

    let isCancelled = false;

    async function loadSavedCanvas() {
      if (nodes.length > 0 || edges.length > 0) {
        setHasLoadedInitialCanvas(true);
        return;
      }

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/canvas`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          setHasLoadedInitialCanvas(true);
          return;
        }

        const payload: unknown = await response.json();
        const canvas = isCanvasSnapshot((payload as { canvas?: unknown })?.canvas)
          ? (payload as { canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } })
              .canvas
          : isCanvasSnapshot(payload)
            ? payload
            : null;

        if (!canvas || (canvas.nodes.length === 0 && canvas.edges.length === 0)) {
          setHasLoadedInitialCanvas(true);
          return;
        }

        if (isCancelled) {
          return;
        }

        onNodesChange(
          canvas.nodes.map((item) => ({
            type: "add" as const,
            item,
          })),
        );
        onEdgesChange(
          canvas.edges.map((item) => ({
            type: "add" as const,
            item,
          })),
        );
      } finally {
        if (!isCancelled) {
          setHasLoadedInitialCanvas(true);
        }
      }
    }

    void loadSavedCanvas();
    return () => {
      isCancelled = true;
    };
  }, [edges.length, hasLoadedInitialCanvas, nodes.length, onEdgesChange, onNodesChange, projectId]);

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

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      updateMyPresence({ cursor: position });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isDeleteKey = event.key === "Delete" || event.key === "Backspace";
      if (!isDeleteKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (selectedNodes.length === 0 && selectedEdges.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onDelete({ nodes: selectedNodes, edges: selectedEdges });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDelete, selectedEdges, selectedNodes]);

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  useEffect(() => {
    const handleBlur = () => {
      updateMyPresence({ cursor: null });
    };
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [updateMyPresence]);

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      // 1. Clear all existing nodes and edges first in the canvas
      if (nodes.length > 0 || edges.length > 0) {
        onDelete({ nodes, edges });
      }

      // 2. Clone template data so canvas modifications don't mutate CANVAS_TEMPLATES
      const clonedNodes: CanvasNode[] = template.nodes.map((node) => ({
        ...node,
        position: { ...node.position },
        data: { ...node.data },
      }));
      const clonedEdges: CanvasEdge[] = template.edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          label: edge.data?.label ?? "",
        },
      }));

      // 3. Add the selected template nodes and edges after the canvas is cleared
      if (clonedNodes.length > 0) {
        onNodesChange(
          clonedNodes.map((item) => ({
            type: "add" as const,
            item,
          })),
        );
      }

      if (clonedEdges.length > 0) {
        onEdgesChange(
          clonedEdges.map((item) => ({
            type: "add" as const,
            item,
          })),
        );
      }

      // 4. Fit the view after the template is loaded
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          fitView({ duration: 200 });
        }, 50);
      });
    },
    [nodes, edges, onDelete, onNodesChange, onEdgesChange, fitView],
  );

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

    const canvasRect = event.currentTarget.getBoundingClientRect();
    const pointerInsideCanvas = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top,
    };
    const flowPosition = screenToFlowPosition({
      x: canvasRect.left + pointerInsideCanvas.x,
      y: canvasRect.top + pointerInsideCanvas.y,
    });
    const position = {
      x: flowPosition.x - payload.width / 2,
      y: flowPosition.y - payload.height / 2,
    };

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
        deleteKeyCode={null}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={canvasEdgeStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
        <LiveCursors />
      </ReactFlow>
      <CanvasParticipantAvatars isAiOpen={isAiOpen} />
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
      <StarterTemplatesModal
        open={Boolean(isTemplatesOpen)}
        onOpenChange={(open) => onOpenTemplatesChange?.(open)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
