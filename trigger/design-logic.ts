import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import {
  AI_ARCHITECT_COLOR,
  AI_ARCHITECT_NAME,
  AI_STATUS_FEED_ID,
  AI_USER_ID_PREFIX,
  isAiUserId,
} from "@/lib/ai-presence";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  DEFAULT_NODE_SIZES,
  MIN_NODE_SIZE,
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

export {
  AI_ARCHITECT_COLOR,
  AI_ARCHITECT_NAME,
  AI_STATUS_FEED_ID,
  AI_USER_ID_PREFIX,
  isAiUserId,
};

export const designAgentTaskSchema = z.object({
  runId: z.string().min(1),
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  prompt: z.string().min(1),
  userId: z.string().min(1),
});

export type DesignAgentTaskInput = z.infer<typeof designAgentTaskSchema>;

export interface DesignAgentTaskResult {
  runId: string;
  projectId: string;
  roomId: string;
  userId: string;
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  message: string;
}

export interface DesignRunTokenClaims {
  runId: string;
  projectId: string;
  userId: string;
  kind: "design-run-token";
  exp: number;
}

interface DesignPlanOperationBase {
  id: string;
}

interface DesignAddNodeOperation extends DesignPlanOperationBase {
  type: "add-node";
  label: string;
  shape?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface DesignMoveNodeOperation extends DesignPlanOperationBase {
  type: "move-node";
  x?: number;
  y?: number;
}

interface DesignResizeNodeOperation extends DesignPlanOperationBase {
  type: "resize-node";
  width?: number;
  height?: number;
}

interface DesignUpdateNodeDataOperation extends DesignPlanOperationBase {
  type: "update-node-data";
  label?: string;
  shape?: string;
  color?: string;
}

interface DesignDeleteNodeOperation extends DesignPlanOperationBase {
  type: "delete-node";
}

interface DesignAddEdgeOperation extends DesignPlanOperationBase {
  type: "add-edge";
  source: string;
  target: string;
  label?: string;
}

interface DesignDeleteEdgeOperation extends DesignPlanOperationBase {
  type: "delete-edge";
}

export type DesignPlanOperation =
  | DesignAddNodeOperation
  | DesignMoveNodeOperation
  | DesignResizeNodeOperation
  | DesignUpdateNodeDataOperation
  | DesignDeleteNodeOperation
  | DesignAddEdgeOperation
  | DesignDeleteEdgeOperation;

export interface DesignPlan {
  status: "ready" | "fallback";
  operations: DesignPlanOperation[];
  summary?: string;
}

export type AiStatusStage = "start" | "processing" | "complete" | "error";

export interface AiStatusMessage {
  kind: "ai-status";
  stage: AiStatusStage;
  message: string;
  text?: string;
  createdAt: number;
}

export interface DesignCanvasSnapshot {
  nodes: Array<{
    id: string;
    label?: string;
    shape?: string;
    color?: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

export interface DesignFlowMutator {
  getNode(id: string): CanvasNode | undefined;
  getEdge(id: string): CanvasEdge | undefined;
  addNode(node: CanvasNode): void;
  updateNode(id: string, updater: (node: CanvasNode) => CanvasNode): void;
  updateNodeData(
    id: string,
    updater: (data: CanvasNode["data"]) => CanvasNode["data"],
  ): void;
  removeNode(id: string): void;
  addEdge(edge: CanvasEdge): void;
  removeEdge(id: string): void;
}

export interface DesignAgentCollaborators {
  generatePlan: (prompt: string) => Promise<DesignPlan>;
  applyPlan: (roomId: string, runId: string, plan: DesignPlan) => Promise<void>;
  publishStatus: (
    roomId: string,
    message: string,
    stage: AiStatusStage,
  ) => Promise<void>;
  setPresence: (
    roomId: string,
    runId: string,
    thinking: boolean,
    cursor?: { x: number; y: number } | null,
  ) => Promise<void>;
  clearPresence: (roomId: string, runId: string) => Promise<void>;
}

export const AI_PRESENCE_TTL_ACTIVE = 120;
export const AI_PRESENCE_TTL_CLEAR = 2;

export const DESIGN_LAYOUT = {
  originX: 120,
  originY: 140,
  columnGap: 260,
  rowGap: 160,
} as const;

const COMMERCE_DOMAIN_PATTERN = /e-commerce|ecommerce|commerce|shop|storefront|checkout/i;

interface EntityTemplate {
  keyword: RegExp;
  label: string;
  shape: NodeShape;
}

const COMMERCE_TEMPLATES: EntityTemplate[] = [
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Storefront", shape: "rectangle" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "API Gateway", shape: "pill" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Catalog Service", shape: "pill" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Cart Service", shape: "pill" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Checkout Service", shape: "pill" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Payment Service", shape: "hexagon" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Inventory Service", shape: "pill" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Notification Service", shape: "rectangle" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Webhook Worker", shape: "rectangle" },
  { keyword: COMMERCE_DOMAIN_PATTERN, label: "Orders DB", shape: "cylinder" },
];

const ENTITY_TEMPLATES: EntityTemplate[] = [
  ...COMMERCE_TEMPLATES,
  { keyword: /browser|web app|frontend|client/i, label: "Browser", shape: "rectangle" },
  { keyword: /api gateway|gateway|api|backend/i, label: "API Gateway", shape: "pill" },
  { keyword: /auth|login|identity/i, label: "Auth Service", shape: "circle" },
  { keyword: /database|db|store|data/i, label: "Database", shape: "cylinder" },
  { keyword: /queue|messaging|events/i, label: "Message Queue", shape: "hexagon" },
  { keyword: /cache|redis/i, label: "Cache", shape: "diamond" },
  { keyword: /worker|consumer|jobs/i, label: "Worker", shape: "rectangle" },
];

const COMMERCE_FLOW_EDGES: Array<{ source: string; target: string; label: string }> = [
  { source: "Storefront", target: "API Gateway", label: "browse" },
  { source: "API Gateway", target: "Catalog Service", label: "browse" },
  { source: "API Gateway", target: "Cart Service", label: "cart" },
  { source: "API Gateway", target: "Checkout Service", label: "checkout" },
  { source: "Checkout Service", target: "Payment Service", label: "pay" },
  { source: "Checkout Service", target: "Inventory Service", label: "reserve" },
  { source: "Payment Service", target: "Webhook Worker", label: "webhook" },
  { source: "Webhook Worker", target: "Notification Service", label: "notify" },
  { source: "Checkout Service", target: "Orders DB", label: "order" },
];

export function sanitizeNodeShape(value: string | undefined): NodeShape {
  if (typeof value === "string" && (NODE_SHAPES as readonly string[]).includes(value)) {
    return value as NodeShape;
  }

  return DEFAULT_NODE_SHAPE;
}

export function sanitizeNodeColor(
  value: string | undefined,
): (typeof NODE_COLORS)[number]["fill"] {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    const normalized = value.toUpperCase();
    const match = NODE_COLORS.find((color) => color.fill.toUpperCase() === normalized);
    if (match) {
      return match.fill;
    }
  }

  return DEFAULT_NODE_COLOR.fill;
}

function clampSize(
  width: number | undefined,
  height: number | undefined,
  shape: NodeShape,
): { width: number; height: number } {
  const defaults = DEFAULT_NODE_SIZES[shape];
  return {
    width: Math.max(width ?? defaults.width, MIN_NODE_SIZE.width),
    height: Math.max(height ?? defaults.height, MIN_NODE_SIZE.height),
  };
}

export function applyLayoutRules(
  operations: DesignPlanOperation[],
): DesignPlanOperation[] {
  let placedNodeCount = 0;

  return operations.map((operation) => {
    if (operation.type !== "add-node") {
      return operation;
    }

    const hasPosition =
      typeof operation.x === "number" && typeof operation.y === "number";
    const column = placedNodeCount % 4;
    const row = Math.floor(placedNodeCount / 4);
    placedNodeCount += 1;

    const shape = sanitizeNodeShape(operation.shape);
    const size = clampSize(operation.width, operation.height, shape);

    return {
      ...operation,
      shape,
      color: sanitizeNodeColor(operation.color),
      x: hasPosition ? operation.x : DESIGN_LAYOUT.originX + column * DESIGN_LAYOUT.columnGap,
      y: hasPosition ? operation.y : DESIGN_LAYOUT.originY + row * DESIGN_LAYOUT.rowGap,
      width: size.width,
      height: size.height,
    };
  });
}

export function normalizeDesignPlan(
  plan: Partial<DesignPlan>,
): DesignPlan {
  const operations = Array.isArray(plan.operations) ? plan.operations : [];

  if (operations.length === 0) {
    return { status: "fallback", operations: [] };
  }

  const normalized = applyLayoutRules(
    operations.map((operation): DesignPlanOperation => {
      switch (operation.type) {
        case "add-node":
          return {
            ...operation,
            id: operation.id || `node-${slugify(operation.label ?? "service")}`,
            label: (operation.label ?? "Service").trim() || "Service",
            shape: sanitizeNodeShape(operation.shape),
            color: sanitizeNodeColor(operation.color),
            x: typeof operation.x === "number" ? operation.x : undefined,
            y: typeof operation.y === "number" ? operation.y : undefined,
            width: operation.width,
            height: operation.height,
          };
        case "add-edge":
          return {
            ...operation,
            id: operation.id || `edge-${slugify(`${operation.source}-${operation.target}`)}`,
            source: operation.source ?? "",
            target: operation.target ?? "",
            label: operation.label ?? "",
          };
        case "move-node":
          return {
            ...operation,
            id: operation.id,
            x: operation.x,
            y: operation.y,
          };
        case "resize-node": {
          const size = clampSize(operation.width, operation.height, DEFAULT_NODE_SHAPE);
          return {
            ...operation,
            id: operation.id,
            width: size.width,
            height: size.height,
          };
        }
        case "update-node-data":
          return {
            ...operation,
            id: operation.id,
            label: operation.label,
            shape: operation.shape ? sanitizeNodeShape(operation.shape) : undefined,
            color: operation.color ? sanitizeNodeColor(operation.color) : undefined,
          };
        case "delete-node":
        case "delete-edge":
          return {
            ...operation,
            id: operation.id,
          };
        default: {
          const exhaustive: never = operation;
          return exhaustive;
        }
      }
    }),
  );

  return {
    status: plan.status === "fallback" ? "fallback" : "ready",
    summary: typeof plan.summary === "string" ? plan.summary : undefined,
    operations: normalized,
  };
}

function createNodeOperations(selected: string[]): DesignAddNodeOperation[] {
  return selected.map((label, index) => {
    const shape =
      ENTITY_TEMPLATES.find((entry) => entry.label === label)?.shape ??
      (index % 2 === 0 ? "rectangle" : "pill");

    return {
      type: "add-node",
      id: `node-${slugify(label)}-${index}`,
      label,
      shape,
      color: NODE_COLORS[index % NODE_COLORS.length].fill,
    };
  });
}

function buildCommerceDesignPlan(): DesignPlan {
  const selected = COMMERCE_TEMPLATES.map((template) => template.label);
  const nodes = createNodeOperations(selected);
  const nodeIds = new Map(nodes.map((node) => [node.label, node.id]));

  const operations: DesignPlanOperation[] = [
    ...nodes,
    ...COMMERCE_FLOW_EDGES.map((edge, index) => ({
      type: "add-edge" as const,
      id: `edge-${index + 1}`,
      source: nodeIds.get(edge.source) ?? "",
      target: nodeIds.get(edge.target) ?? "",
      label: edge.label,
    })),
  ];

  return normalizeDesignPlan({
    status: "ready",
    summary: `Planned ${selected.length} architecture components for the requested system design.`,
    operations,
  });
}

export function buildDesignPlan(prompt: string): DesignPlan {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { status: "fallback", operations: [] };
  }

  if (COMMERCE_DOMAIN_PATTERN.test(trimmed)) {
    return buildCommerceDesignPlan();
  }

  const labels = new Map<string, string>();
  for (const { keyword, label } of ENTITY_TEMPLATES) {
    if (keyword.test(trimmed)) {
      labels.set(label, label);
    }
  }

  const fallbackLabels = ["Browser", "API Gateway", "Auth Service", "Database"];
  const selected = labels.size > 0 ? Array.from(labels.values()) : fallbackLabels;
  const nodes = createNodeOperations(selected);

  const operations: DesignPlanOperation[] = [...nodes];
  for (let index = 1; index < selected.length; index += 1) {
    operations.push({
      type: "add-edge",
      id: `edge-${index}`,
      source: nodes[index - 1]?.id ?? "",
      target: nodes[index]?.id ?? "",
      label: index === 1 ? "request" : "data",
    });
  }

  return normalizeDesignPlan({
    status: "ready",
    summary: `Planned ${selected.length} architecture components for the requested system design.`,
    operations,
  });
}

export function applyDesignOperations(
  flow: DesignFlowMutator,
  operations: DesignPlanOperation[],
): void {
  for (const operation of operations) {
    switch (operation.type) {
      case "add-node": {
        const shape = sanitizeNodeShape(operation.shape);
        const size = clampSize(operation.width, operation.height, shape);
        flow.addNode({
          id: operation.id,
          type: CANVAS_NODE_TYPE,
          position: {
            x: typeof operation.x === "number" ? operation.x : DESIGN_LAYOUT.originX,
            y: typeof operation.y === "number" ? operation.y : DESIGN_LAYOUT.originY,
          },
          width: size.width,
          height: size.height,
          data: {
            label: (operation.label ?? "Service").trim() || "Service",
            color: sanitizeNodeColor(operation.color),
            shape,
          },
        });
        break;
      }
      case "move-node": {
        flow.updateNode(operation.id, (node) => ({
          ...node,
          position: {
            x: typeof operation.x === "number" ? operation.x : node.position.x,
            y: typeof operation.y === "number" ? operation.y : node.position.y,
          },
        }));
        break;
      }
      case "resize-node": {
        flow.updateNode(operation.id, (node) => {
          const shape = sanitizeNodeShape(node.data.shape);
          const size = clampSize(
            operation.width ?? node.width,
            operation.height ?? node.height,
            shape,
          );
          return {
            ...node,
            width: size.width,
            height: size.height,
          };
        });
        break;
      }
      case "update-node-data": {
        flow.updateNodeData(operation.id, (data) => ({
          ...data,
          label: operation.label ?? data.label,
          color: operation.color ? sanitizeNodeColor(operation.color) : data.color,
          shape: operation.shape ? sanitizeNodeShape(operation.shape) : data.shape,
        }));
        break;
      }
      case "delete-node": {
        flow.removeNode(operation.id);
        break;
      }
      case "add-edge": {
        if (!operation.source || !operation.target) {
          break;
        }

        flow.addEdge({
          id: operation.id,
          type: CANVAS_EDGE_TYPE,
          source: operation.source,
          target: operation.target,
          data: {
            label: operation.label ?? "",
          },
          style: {
            stroke: "var(--text-muted)",
            strokeWidth: 1,
          },
          markerEnd: {
            type: "arrowclosed",
            color: "var(--text-muted)",
          },
        });
        break;
      }
      case "delete-edge": {
        flow.removeEdge(operation.id);
        break;
      }
      default: {
        const exhaustive: never = operation;
        void exhaustive;
      }
    }
  }
}

export function createAiUserId(runId: string): string {
  return `${AI_USER_ID_PREFIX}-${runId}`;
}

export function createAiPresencePayload(
  runId: string,
  options: {
    thinking: boolean;
    cursor?: { x: number; y: number } | null;
    clear?: boolean;
  },
) {
  return {
    userId: createAiUserId(runId),
    data: {
      cursor: options.cursor ?? null,
      thinking: options.thinking,
    },
    userInfo: {
      name: AI_ARCHITECT_NAME,
      avatar: "",
      color: AI_ARCHITECT_COLOR,
    },
    ttl: options.clear ? AI_PRESENCE_TTL_CLEAR : AI_PRESENCE_TTL_ACTIVE,
  };
}

export function createAiStatusMessage(
  stage: AiStatusStage,
  message: string,
  createdAt = Date.now(),
): AiStatusMessage {
  return {
    kind: "ai-status",
    stage,
    message,
    text: message,
    createdAt,
  };
}

export function cursorForPlan(plan: DesignPlan): { x: number; y: number } {
  for (const operation of plan.operations) {
    if (operation.type === "add-node" || operation.type === "move-node") {
      if (typeof operation.x === "number" && typeof operation.y === "number") {
        return { x: operation.x, y: operation.y };
      }
    }
  }

  return { x: DESIGN_LAYOUT.originX, y: DESIGN_LAYOUT.originY };
}

export async function executeDesignAgentRun(
  input: DesignAgentTaskInput,
  collaborators: DesignAgentCollaborators,
): Promise<DesignAgentTaskResult> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  await collaborators.setPresence(
    input.roomId,
    input.runId,
    true,
    { x: DESIGN_LAYOUT.originX, y: DESIGN_LAYOUT.originY },
  );
  await collaborators.publishStatus(
    input.roomId,
    "AI Architect started the design task.",
    "start",
  );
  await collaborators.publishStatus(
    input.roomId,
    "AI Architect is mapping the prompt to a system design.",
    "processing",
  );

  try {
    const plan = normalizeDesignPlan(await collaborators.generatePlan(prompt));
    await collaborators.setPresence(
      input.roomId,
      input.runId,
      true,
      cursorForPlan(plan),
    );
    await collaborators.applyPlan(input.roomId, input.runId, plan);
    await collaborators.publishStatus(
      input.roomId,
      "AI Architect completed the design update.",
      "complete",
    );
    await collaborators.clearPresence(input.roomId, input.runId);

    return {
      runId: input.runId,
      projectId: input.projectId,
      roomId: input.roomId,
      userId: input.userId,
      prompt,
      status: "completed",
      message: "Design task completed and the canvas has been updated.",
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown design task error";
    await collaborators.publishStatus(
      input.roomId,
      `AI Architect failed: ${reason}`,
      "error",
    );
    await collaborators.clearPresence(input.roomId, input.runId);

    return {
      runId: input.runId,
      projectId: input.projectId,
      roomId: input.roomId,
      userId: input.userId,
      prompt,
      status: "failed",
      message: `Design task failed: ${reason}`,
    };
  }
}

function getDesignRunTokenSecret(): string {
  const secret = process.env.DESIGN_RUN_TOKEN_SECRET;
  if (!secret) {
    throw new Error("DESIGN_RUN_TOKEN_SECRET is not set");
  }

  return secret;
}

export function createDesignRunToken(input: {
  runId: string;
  projectId: string;
  userId: string;
}): string {
  const secret = getDesignRunTokenSecret();
  const payload: DesignRunTokenClaims = {
    runId: input.runId,
    projectId: input.projectId,
    userId: input.userId,
    kind: "design-run-token",
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");

  return `${body}.${signature}`;
}

export function verifyDesignRunToken(token: string): DesignRunTokenClaims | null {
  const secret = process.env.DESIGN_RUN_TOKEN_SECRET;
  if (!secret || !token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret).update(body).digest();
  const providedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<DesignRunTokenClaims>;
    if (
      !payload ||
      payload.kind !== "design-run-token" ||
      typeof payload.runId !== "string" ||
      typeof payload.projectId !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.exp !== "number" ||
      Number.isNaN(payload.exp)
    ) {
      return null;
    }

    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }

    return {
      runId: payload.runId,
      projectId: payload.projectId,
      userId: payload.userId,
      kind: "design-run-token",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 18) || "node"
  );
}
