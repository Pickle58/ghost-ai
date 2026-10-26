import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { AI_CHAT_FEED_ID } from "@/lib/ai-presence";
import {
  createAiChatMessage,
  getAiStatusFeedText,
  isActiveAiStatus,
  parseAiChatMessage,
  parseAiStatusFeedPayload,
} from "@/types/tasks";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  DEFAULT_NODE_SIZES,
  MIN_NODE_SIZE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

import {
  AI_PRESENCE_TTL_CLEAR,
  AI_STATUS_FEED_ID,
  DESIGN_LAYOUT,
  applyDesignOperations,
  applyLayoutRules,
  buildDesignPlan,
  createAiPresencePayload,
  createAiStatusMessage,
  createDesignRunToken,
  designAgentTaskSchema,
  executeDesignAgentRun,
  normalizeDesignPlan,
  sanitizeNodeColor,
  sanitizeNodeShape,
  verifyDesignRunToken,
  type DesignFlowMutator,
} from "./design-logic";
import { buildDesignPrompt } from "./design-prompt";

describe("design agent token", () => {
  beforeEach(() => {
    process.env.DESIGN_RUN_TOKEN_SECRET = "super-secret";
  });

  it("creates a signed token with an expiry", () => {
    const token = createDesignRunToken({
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
    });

    assert.match(token, /\./);
    const parsed = verifyDesignRunToken(token);
    assert.deepEqual(parsed, {
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
      kind: "design-run-token",
      exp: parsed?.exp ?? 0,
    });
    assert.ok((parsed?.exp ?? 0) > Math.floor(Date.now() / 1000));
  });

  it("rejects tokens that are expired or tampered with", () => {
    const signedToken = createDesignRunToken({
      runId: "run_123",
      projectId: "project_456",
      userId: "user_789",
    });

    const lastChar = signedToken.at(-1) ?? "A";
    const tampered = `${signedToken.slice(0, -1)}${lastChar === "A" ? "B" : "A"}`;
    assert.equal(verifyDesignRunToken(tampered), null);

    const expired = [
      Buffer.from(JSON.stringify({
        runId: "run_123",
        projectId: "project_456",
        userId: "user_789",
        kind: "design-run-token",
        exp: 0,
      })).toString("base64url"),
      Buffer.from("bad-signature").toString("base64url"),
    ].join(".");

    assert.equal(verifyDesignRunToken(expired), null);
  });
});

describe("design agent payload schema", () => {
  it("accepts a camelCase design-agent payload", () => {
    const parsed = designAgentTaskSchema.parse({
      runId: "design-test-1",
      projectId: "system-design-llka7c",
      roomId: "system-design-llka7c",
      userId: "test-user",
      prompt: "Architect a real-time chat application.",
    });

    assert.equal(parsed.roomId, "system-design-llka7c");
  });

  it("rejects a kebab-case room-id test payload before the task runs", () => {
    const result = designAgentTaskSchema.safeParse({
      "room-id": "system-design-llka7c",
      prompt: "Architect a real-time chat application.",
    });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }

    const missing = result.error.issues.map((issue) => issue.path.join("."));
    assert.ok(missing.includes("runId"));
    assert.ok(missing.includes("projectId"));
    assert.ok(missing.includes("roomId"));
    assert.ok(missing.includes("userId"));
  });
});

describe("design agent planning", () => {
  it("sanitizes unsupported shapes and colors to valid defaults", () => {
    assert.equal(sanitizeNodeShape("blob"), "rectangle");
    assert.equal(sanitizeNodeColor("#not-a-color"), "#1F1F1F");
  });

  it("builds a valid prompt-driven plan with graph actions", () => {
    const plan = buildDesignPlan(
      "Design a simple user auth flow with a browser, API gateway, and auth service",
    );

    assert.equal(plan.status, "ready");
    assert.ok(plan.operations.length > 0);
    assert.ok(plan.operations.some((op) => op.type === "add-node"));
    assert.ok(plan.operations.every((op) => {
      if (op.type === "add-node" || op.type === "add-edge") {
        return typeof op.label === "string" && op.label.trim().length > 0;
      }
      return true;
    }));
  });

  it("falls back to keyword templates for the chat prompt, matching Database and Message Queue", () => {
    const plan = buildDesignPlan(
      "Architect a real-time chat application. I need a Websocket server for live messaging. A prescence server to track online users. A relational database for message history. Connect the sevices using a pub/sub system like Reddis so it can scale horizontally, and include an S3 bucket for media attachments.",
    );

    const labels = plan.operations
      .filter((operation) => operation.type === "add-node")
      .map((operation) => operation.label);

    assert.deepEqual(labels, ["Database", "Message Queue"]);
    assert.equal(
      plan.operations.find((operation) => operation.type === "add-edge")?.label,
      "Publish Event",
    );
  });

  it("labels generic fallback edges by destination, not request/data", () => {
    const plan = buildDesignPlan(
      "Design a simple user auth flow with a browser, API gateway, auth service, and database",
    );
    const edgeLabels = plan.operations
      .filter((operation) => operation.type === "add-edge")
      .map((operation) => operation.label);

    assert.ok(edgeLabels.includes("HTTP"));
    assert.ok(edgeLabels.includes("Read/Write"));
    assert.ok(!edgeLabels.includes("request"));
    assert.ok(!edgeLabels.includes("data"));
  });

  it("fills a missing add-edge label from the destination node so the canvas pill can render", () => {
    const plan = normalizeDesignPlan({
      status: "ready",
      operations: [
        { type: "add-node", id: "gateway", label: "API Gateway" },
        { type: "add-node", id: "db", label: "Orders DB" },
        { type: "add-edge", id: "e1", source: "gateway", target: "db", label: "   " },
      ],
    });
    const edge = plan.operations.find((operation) => operation.type === "add-edge");

    assert.equal(edge?.type, "add-edge");
    if (edge?.type !== "add-edge") {
      return;
    }
    assert.equal(edge.label, "Read/Write");
  });

  it("builds a commerce graph for Design an e-commerce backend", () => {
    const plan = buildDesignPlan("Design an e-commerce backend");
    const labels = plan.operations
      .filter((operation) => operation.type === "add-node")
      .map((operation) => operation.label);

    assert.ok(labels.includes("Catalog Service"));
    assert.ok(labels.includes("Cart Service"));
    assert.ok(labels.includes("Checkout Service"));
    assert.ok(labels.includes("Payment Service"));
    assert.ok(labels.includes("Inventory Service"));

    const nodesByLabel = new Map(
      plan.operations
        .filter((operation) => operation.type === "add-node")
        .map((operation) => [operation.label, operation.id]),
    );
    const edges = plan.operations.filter((operation) => operation.type === "add-edge");
    const edgeLabels = edges.map((operation) => operation.label);

    assert.ok(edgeLabels.includes("browse"));
    assert.ok(edgeLabels.includes("cart"));
    assert.ok(edgeLabels.includes("checkout"));
    assert.ok(edgeLabels.includes("pay"));
    assert.ok(edgeLabels.includes("reserve"));
    assert.ok(edgeLabels.includes("webhook"));
    assert.ok(edgeLabels.includes("notify"));
    assert.ok(!edgeLabels.every((label) => label === "request" || label === "data"));
    assert.ok(
      edges.some(
        (edge) =>
          edge.source === nodesByLabel.get("Checkout Service") &&
          edge.target === nodesByLabel.get("Payment Service") &&
          edge.label === "pay",
      ),
    );
    assert.ok(
      edges.some(
        (edge) =>
          edge.source === nodesByLabel.get("Payment Service") &&
          edge.target === nodesByLabel.get("Webhook Worker") &&
          edge.label === "webhook",
      ),
    );
  });

  it("does not treat a workshop scheduling prompt as commerce", () => {
    const plan = buildDesignPlan("Design a workshop scheduling application");
    const labels = plan.operations
      .filter((operation) => operation.type === "add-node")
      .map((operation) => operation.label);

    assert.ok(!labels.includes("Catalog Service"));
    assert.ok(!labels.includes("Cart Service"));
    assert.ok(!labels.includes("Checkout Service"));
    assert.ok(!labels.includes("Payment Service"));
    assert.ok(!labels.includes("Inventory Service"));
  });

  it("does not turn a CI/CD prompt into a commerce graph", () => {
    const plan = buildDesignPlan(
      "Design a CI/CD pipeline with a source repository, build runner, and production deploy.",
    );
    const labels = plan.operations
      .filter((operation) => operation.type === "add-node")
      .map((operation) => operation.label);

    assert.ok(!labels.includes("Catalog Service"));
    assert.ok(!labels.includes("Cart Service"));
    assert.ok(!labels.includes("Checkout Service"));
    assert.ok(!labels.includes("Payment Service"));
    assert.ok(!labels.includes("Inventory Service"));
  });

  it("normalizes unsupported plan values onto the canvas palette and layout", () => {
    const plan = normalizeDesignPlan({
      status: "ready",
      operations: [
        {
          type: "add-node",
          id: "svc",
          label: "Payments",
          shape: "blob",
          color: "#FFFFFF",
          width: 10,
          height: 10,
        },
      ],
    });

    const operation = plan.operations[0];
    assert.equal(operation.type, "add-node");
    if (operation.type !== "add-node") {
      return;
    }

    assert.equal(operation.shape, DEFAULT_NODE_SHAPE);
    assert.equal(operation.color, DEFAULT_NODE_COLOR.fill);
    assert.ok((operation.width ?? 0) >= MIN_NODE_SIZE.width);
    assert.ok((operation.height ?? 0) >= MIN_NODE_SIZE.height);
    assert.equal(operation.x, DESIGN_LAYOUT.originX);
    assert.equal(operation.y, DESIGN_LAYOUT.originY);
  });

  it("requires Gemini to label every add-edge with a short protocol or flow name", () => {
    const prompt = buildDesignPrompt({ prompt: "Design a checkout" });

    assert.match(prompt, /Never leave an edge unlabeled/);
    assert.match(prompt, /HTTP/);
    assert.match(prompt, /Read\/Write/);
    assert.match(prompt, /Publish Event/);
    assert.match(prompt, /Design a checkout/);
  });
});

describe("design agent layout", () => {
  it("spaces missing node positions on a consistent grid", () => {
    const operations = applyLayoutRules([
      { type: "add-node", id: "a", label: "A" },
      { type: "add-node", id: "b", label: "B" },
      { type: "add-node", id: "c", label: "C" },
    ]);

    const nodes = operations.filter((operation) => operation.type === "add-node");
    assert.equal(nodes[0]?.x, DESIGN_LAYOUT.originX);
    assert.equal(nodes[1]?.x, DESIGN_LAYOUT.originX + DESIGN_LAYOUT.columnGap);
    assert.equal(nodes[2]?.x, DESIGN_LAYOUT.originX + DESIGN_LAYOUT.columnGap * 2);
    assert.equal(nodes[0]?.y, DESIGN_LAYOUT.originY);
  });
});

describe("design agent canvas operations", () => {
  it("applies add, move, resize, update, and delete actions through the flow mutator", () => {
    const flow = createMemoryFlow();

    applyDesignOperations(flow, [
      {
        type: "add-node",
        id: "gateway",
        label: "API Gateway",
        shape: "pill",
        color: "#10233D",
        x: 120,
        y: 140,
        width: DEFAULT_NODE_SIZES.pill.width,
        height: DEFAULT_NODE_SIZES.pill.height,
      },
      {
        type: "add-node",
        id: "auth",
        label: "Auth",
        shape: "circle",
        color: "#2E1938",
        x: 380,
        y: 140,
        width: DEFAULT_NODE_SIZES.circle.width,
        height: DEFAULT_NODE_SIZES.circle.height,
      },
      {
        type: "add-edge",
        id: "gateway-auth",
        source: "gateway",
        target: "auth",
        label: "HTTP",
      },
      { type: "move-node", id: "auth", x: 420, y: 180 },
      { type: "resize-node", id: "gateway", width: 220, height: 80 },
      { type: "update-node-data", id: "auth", label: "Auth Service", color: "#0F2E18" },
    ]);

    const gateway = flow.getNode("gateway");
    const auth = flow.getNode("auth");
    const edge = flow.getEdge("gateway-auth");

    assert.equal(gateway?.type, CANVAS_NODE_TYPE);
    assert.equal(gateway?.width, 220);
    assert.equal(gateway?.height, 80);
    assert.deepEqual(auth?.position, { x: 420, y: 180 });
    assert.equal(auth?.data.label, "Auth Service");
    assert.equal(auth?.data.color, "#0F2E18");
    assert.equal(edge?.type, CANVAS_EDGE_TYPE);
    assert.equal(edge?.data?.label, "HTTP");

    applyDesignOperations(flow, [
      { type: "add-node", id: "queue", label: "Message Queue" },
      { type: "add-edge", id: "auth-queue", source: "auth", target: "queue" },
    ]);
    assert.equal(flow.getEdge("auth-queue")?.data?.label, "Publish Event");

    applyDesignOperations(flow, [
      { type: "delete-edge", id: "gateway-auth" },
      { type: "delete-node", id: "auth" },
    ]);

    assert.equal(flow.getEdge("gateway-auth"), undefined);
    assert.equal(flow.getNode("auth"), undefined);
    assert.ok(flow.getNode("gateway"));
  });
});

describe("design agent presence and status", () => {
  it("builds AI presence with cursor and thinking state", () => {
    const active = createAiPresencePayload("run_1", {
      thinking: true,
      cursor: { x: 240, y: 160 },
    });

    assert.equal(active.userId, "ghost-ai-run_1");
    assert.equal(active.data.thinking, true);
    assert.deepEqual(active.data.cursor, { x: 240, y: 160 });
    assert.equal(active.userInfo.name, "AI Architect");

    const cleared = createAiPresencePayload("run_1", { thinking: false, clear: true });
    assert.equal(cleared.data.thinking, false);
    assert.equal(cleared.data.cursor, null);
    assert.equal(cleared.ttl, AI_PRESENCE_TTL_CLEAR);
  });

  it("builds status-feed messages for start, processing, complete, and error", () => {
    assert.equal(AI_STATUS_FEED_ID, "ai-status-feed");
    assert.deepEqual(createAiStatusMessage("start", "started", 1), {
      kind: "ai-status",
      stage: "start",
      message: "started",
      text: "started",
      createdAt: 1,
    });
    assert.equal(createAiStatusMessage("processing", "working", 2).stage, "processing");
    assert.equal(createAiStatusMessage("complete", "done", 3).stage, "complete");
    assert.equal(createAiStatusMessage("error", "failed", 4).stage, "error");

    const fromText = parseAiStatusFeedPayload({ text: " Designing " });
    assert.ok(fromText);
    assert.equal(getAiStatusFeedText(fromText), "Designing");
    assert.equal(isActiveAiStatus({ stage: "processing" }), true);
    assert.equal(isActiveAiStatus({ stage: "complete" }), false);
    assert.equal(parseAiStatusFeedPayload("not-a-payload"), null);
  });

  it("validates ai-chat feed messages separately from status payloads", () => {
    assert.equal(AI_CHAT_FEED_ID, "ai-chat");
    assert.notEqual(AI_CHAT_FEED_ID, AI_STATUS_FEED_ID);

    const message = createAiChatMessage({
      sender: "Ada",
      role: "user",
      content: "Design a checkout flow",
      timestamp: 42,
    });
    assert.deepEqual(parseAiChatMessage(message), {
      sender: "Ada",
      role: "user",
      content: "Design a checkout flow",
      timestamp: 42,
    });
    assert.equal(parseAiChatMessage({ text: "status only" }), null);
    assert.equal(parseAiChatMessage({ sender: "", role: "user", content: "x", timestamp: 1 }), null);
  });

  it("publishes progress, applies the plan, and clears presence when the run succeeds", async () => {
    const stages: string[] = [];
    const presence: Array<{ thinking: boolean; clear?: boolean }> = [];
    let applied = false;

    const result = await executeDesignAgentRun(
      {
        runId: "run_ok",
        projectId: "project_1",
        roomId: "room_1",
        prompt: "Design an auth flow",
        userId: "user_1",
      },
      {
        generatePlan: async () => ({
          status: "ready",
          operations: [{ type: "add-node", id: "n1", label: "API" }],
        }),
        applyPlan: async () => {
          applied = true;
        },
        publishStatus: async (_roomId, _message, stage) => {
          stages.push(stage);
        },
        setPresence: async (_roomId, _runId, thinking) => {
          presence.push({ thinking });
        },
        clearPresence: async () => {
          presence.push({ thinking: false, clear: true });
        },
      },
    );

    assert.equal(result.status, "completed");
    assert.equal(applied, true);
    assert.deepEqual(stages, ["start", "processing", "complete"]);
    assert.equal(presence.at(-1)?.clear, true);
  });

  it("publishes an error status and clears presence without throwing when apply fails", async () => {
    const stages: string[] = [];
    let cleared = false;

    const result = await executeDesignAgentRun(
      {
        runId: "run_fail",
        projectId: "project_1",
        roomId: "room_1",
        prompt: "Design an auth flow",
        userId: "user_1",
      },
      {
        generatePlan: async () => ({
          status: "ready",
          operations: [{ type: "add-node", id: "n1", label: "API" }],
        }),
        applyPlan: async () => {
          throw new Error("room unavailable");
        },
        publishStatus: async (_roomId, _message, stage) => {
          stages.push(stage);
        },
        setPresence: async () => undefined,
        clearPresence: async () => {
          cleared = true;
        },
      },
    );

    assert.equal(result.status, "failed");
    assert.match(result.message, /room unavailable/);
    assert.ok(stages.includes("error"));
    assert.equal(cleared, true);
  });
});

function createMemoryFlow(
  nodes: CanvasNode[] = [],
  edges: CanvasEdge[] = [],
): DesignFlowMutator & { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const state = {
    nodes: [...nodes],
    edges: [...edges],
  };

  return {
    get nodes() {
      return state.nodes;
    },
    get edges() {
      return state.edges;
    },
    getNode(id: string) {
      return state.nodes.find((node) => node.id === id);
    },
    getEdge(id: string) {
      return state.edges.find((edge) => edge.id === id);
    },
    addNode(node: CanvasNode) {
      state.nodes = state.nodes.filter((existing) => existing.id !== node.id);
      state.nodes.push(node);
    },
    updateNode(id: string, updater: (node: CanvasNode) => CanvasNode) {
      state.nodes = state.nodes.map((node) => (node.id === id ? updater(node) : node));
    },
    updateNodeData(id: string, updater: (data: CanvasNode["data"]) => CanvasNode["data"]) {
      state.nodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: updater(node.data) } : node,
      );
    },
    removeNode(id: string) {
      state.nodes = state.nodes.filter((node) => node.id !== id);
      state.edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
    },
    addEdge(edge: CanvasEdge) {
      state.edges = state.edges.filter((existing) => existing.id !== edge.id);
      state.edges.push(edge);
    },
    removeEdge(id: string) {
      state.edges = state.edges.filter((edge) => edge.id !== id);
    },
  };
}
