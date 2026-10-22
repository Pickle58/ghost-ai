"use client";

import { useMemo } from "react";

import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_NODE_SIZES,
  nodeTextColor,
  type CanvasNode,
} from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
  templates?: readonly CanvasTemplate[];
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
  templates = CANVAS_TEMPLATES,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col rounded-3xl border border-surface-border bg-elevated p-0 text-copy-primary ring-border-subtle sm:max-w-4xl">
        <DialogHeader className="border-b border-border-subtle p-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-copy-primary">
            Starter Templates
          </DialogTitle>
          <DialogDescription className="text-sm text-copy-muted">
            Choose a pre-built architecture template to replace your current canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-4 transition-colors hover:border-border-subtle"
              >
                <div>
                  <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-base p-2">
                    <TemplateDiagramPreview template={template} />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-copy-muted">
                    {template.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    onImport(template);
                    onOpenChange(false);
                  }}
                >
                  Import Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TemplateDiagramPreviewProps {
  template: CanvasTemplate;
}

function TemplateDiagramPreview({ template }: TemplateDiagramPreviewProps) {
  const { nodes, edges } = template;

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 400, height: 250 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const fallback = DEFAULT_NODE_SIZES[node.data.shape];
      const width = node.width ?? fallback?.width ?? 160;
      const height = node.height ?? fallback?.height ?? 80;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    }

    const padding = 28;
    return {
      x: minX - padding,
      y: minY - padding,
      width: Math.max(maxX - minX + padding * 2, 100),
      height: Math.max(maxY - minY + padding * 2, 100),
    };
  }, [nodes]);

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      aria-hidden
    >
      {/* Edges rendered as simple lines between node centers */}
      <g>
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) {
            return null;
          }

          const sFallback = DEFAULT_NODE_SIZES[source.data.shape];
          const sWidth = source.width ?? sFallback?.width ?? 160;
          const sHeight = source.height ?? sFallback?.height ?? 80;

          const tFallback = DEFAULT_NODE_SIZES[target.data.shape];
          const tWidth = target.width ?? tFallback?.width ?? 160;
          const tHeight = target.height ?? tFallback?.height ?? 80;

          const sx = source.position.x + sWidth / 2;
          const sy = source.position.y + sHeight / 2;
          const tx = target.position.x + tWidth / 2;
          const ty = target.position.y + tHeight / 2;

          return (
            <line
              key={edge.id}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke="var(--border-subtle)"
              strokeWidth={2}
            />
          );
        })}
      </g>

      {/* Nodes rendered with shape, fill color, and label */}
      <g>
        {nodes.map((node) => (
          <PreviewNode key={node.id} node={node} />
        ))}
      </g>
    </svg>
  );
}

function PreviewNode({ node }: { node: CanvasNode }) {
  const fallback = DEFAULT_NODE_SIZES[node.data.shape];
  const w = node.width ?? fallback?.width ?? 160;
  const h = node.height ?? fallback?.height ?? 80;
  const x = node.position.x;
  const y = node.position.y;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fill = node.data.color;
  const stroke = "var(--border-subtle)";
  const textColor = nodeTextColor(fill);
  const truncatedLabel = truncateText(node.data.label, 16);

  return (
    <g>
      {renderShape(node.data.shape, x, y, w, h, cx, cy, fill, stroke)}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={10}
        fontWeight={500}
        className="select-none font-sans"
        pointerEvents="none"
      >
        {truncatedLabel}
      </text>
    </g>
  );
}

function renderShape(
  shape: CanvasNode["data"]["shape"],
  x: number,
  y: number,
  w: number,
  h: number,
  cx: number,
  cy: number,
  fill: string,
  stroke: string,
) {
  switch (shape) {
    case "rectangle":
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );

    case "pill":
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );

    case "circle": {
      const radius = Math.min(w, h) / 2;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );
    }

    case "diamond":
      return (
        <polygon
          points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );

    case "hexagon": {
      const hexPoints = [
        `${x + w * 0.04},${cy}`,
        `${x + w * 0.27},${y + h * 0.06}`,
        `${x + w * 0.73},${y + h * 0.06}`,
        `${x + w * 0.96},${cy}`,
        `${x + w * 0.73},${y + h * 0.94}`,
        `${x + w * 0.27},${y + h * 0.94}`,
      ].join(" ");

      return (
        <polygon
          points={hexPoints}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    }

    case "cylinder": {
      const rx = w * 0.44;
      const ry = h * 0.12;
      const topY = y + ry;
      const bottomY = y + h - ry;

      return (
        <g>
          <path
            d={`M ${x + w * 0.06} ${topY} L ${x + w * 0.06} ${bottomY} A ${rx} ${ry} 0 0 0 ${x + w * 0.94} ${bottomY} L ${x + w * 0.94} ${topY} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <ellipse
            cx={cx}
            cy={topY}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
        </g>
      );
    }

    default:
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={8}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      );
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
