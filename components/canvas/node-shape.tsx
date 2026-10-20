"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { nodeTextColor, type NodeShape } from "@/types/canvas";

const REST_STROKE = "var(--border-subtle)";
const SELECTED_STROKE = "var(--accent-primary)";
const SHAPE_STROKE_WIDTH = 1.5;

interface NodeShapeGraphicProps {
  shape: NodeShape;
  fill: string;
  selected?: boolean;
  label?: string;
  interactive?: boolean;
}

export function NodeShapeGraphic({
  shape,
  fill,
  selected = false,
  label = "",
  interactive = true,
}: NodeShapeGraphicProps) {
  return (
    <div className="relative h-full w-full" data-shape={shape}>
      <ShapeBody
        shape={shape}
        fill={fill}
        selected={selected}
        interactive={interactive}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-sm"
        style={{ color: nodeTextColor(fill) }}
      >
        {label}
      </div>
    </div>
  );
}

function ShapeBody({
  shape,
  fill,
  selected,
  interactive,
}: {
  shape: NodeShape;
  fill: string;
  selected: boolean;
  interactive: boolean;
}) {
  switch (shape) {
    case "rectangle":
      return (
        <CssShape fill={fill} selected={selected} radiusClass="rounded-xl" />
      );
    case "pill":
    case "circle":
      return (
        <CssShape fill={fill} selected={selected} radiusClass="rounded-full" />
      );
    case "diamond":
      return (
        <DiamondShape fill={fill} selected={selected} interactive={interactive} />
      );
    case "hexagon":
      return (
        <HexagonShape fill={fill} selected={selected} interactive={interactive} />
      );
    case "cylinder":
      return (
        <CylinderShape fill={fill} selected={selected} interactive={interactive} />
      );
    default: {
      const unexpected: never = shape;
      throw new Error(`Unexpected shape: ${String(unexpected)}`);
    }
  }
}

function CssShape({
  fill,
  selected,
  radiusClass,
}: {
  fill: string;
  selected: boolean;
  radiusClass: string;
}) {
  return (
    <div
      className={cn(
        "box-border h-full w-full border",
        radiusClass,
        selected ? "border-brand" : "border-border-subtle",
      )}
      style={{ backgroundColor: fill }}
    />
  );
}

function DiamondShape({
  fill,
  selected,
  interactive,
}: {
  fill: string;
  selected: boolean;
  interactive: boolean;
}) {
  return (
    <ShapeSvg interactive={interactive}>
      <polygon
        points="50,4 96,50 50,96 4,50"
        {...paintedShape(fill, selected)}
      />
    </ShapeSvg>
  );
}

function HexagonShape({
  fill,
  selected,
  interactive,
}: {
  fill: string;
  selected: boolean;
  interactive: boolean;
}) {
  return (
    <ShapeSvg interactive={interactive}>
      <polygon
        points="4,50 27,6 73,6 96,50 73,94 27,94"
        {...paintedShape(fill, selected)}
      />
    </ShapeSvg>
  );
}

function CylinderShape({
  fill,
  selected,
  interactive,
}: {
  fill: string;
  selected: boolean;
  interactive: boolean;
}) {
  const stroke = shapeStroke(selected);

  return (
    <ShapeSvg interactive={interactive}>
      <path d="M6 16 L6 84 A44 12 0 0 0 94 84 L94 16 Z" fill={fill} />
      <path d="M6 16 V84" {...openStroke(stroke)} />
      <path d="M94 16 V84" {...openStroke(stroke)} />
      <path d="M6 84 A44 12 0 0 0 94 84" {...openStroke(stroke)} />
      <ellipse
        cx="50"
        cy="16"
        rx="44"
        ry="12"
        fill={fill}
        stroke={stroke}
        strokeWidth={SHAPE_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
    </ShapeSvg>
  );
}

function ShapeSvg({
  children,
  interactive,
}: {
  children: ReactNode;
  interactive: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents={interactive ? "all" : "none"}
      aria-hidden
      className="block h-full w-full"
    >
      {children}
    </svg>
  );
}

function paintedShape(fill: string, selected: boolean) {
  return {
    fill,
    stroke: shapeStroke(selected),
    strokeWidth: SHAPE_STROKE_WIDTH,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };
}

function openStroke(stroke: string) {
  return {
    fill: "none",
    stroke,
    strokeWidth: SHAPE_STROKE_WIDTH,
    vectorEffect: "non-scaling-stroke" as const,
  };
}

function shapeStroke(selected: boolean): string {
  return selected ? SELECTED_STROKE : REST_STROKE;
}
