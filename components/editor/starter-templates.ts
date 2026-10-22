import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeColor,
  type NodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function createTemplateNode(
  id: string,
  label: string,
  shape: NodeShape,
  color: NodeColor["fill"],
  position: { x: number; y: number },
  size?: { width: number; height: number },
): CanvasNode {
  const defaultSize = DEFAULT_NODE_SIZES[shape];
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position,
    data: {
      label,
      color,
      shape,
    },
    width: size?.width ?? defaultSize.width,
    height: size?.height ?? defaultSize.height,
  };
}

function createTemplateEdge(
  id: string,
  source: string,
  target: string,
  label = "",
): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    data: {
      label,
    },
  };
}

export const CANVAS_TEMPLATES: readonly CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description:
      "Decomposed service topology with an API gateway, domain microservices, and dedicated persistence layers.",
    nodes: [
      createTemplateNode(
        "ms-gateway",
        "API Gateway",
        "hexagon",
        "#10233D",
        { x: 260, y: 30 },
      ),
      createTemplateNode(
        "ms-auth-service",
        "Auth Service",
        "pill",
        "#2E1938",
        { x: 30, y: 190 },
      ),
      createTemplateNode(
        "ms-auth-db",
        "Users DB",
        "cylinder",
        "#062822",
        { x: 66, y: 320 },
      ),
      createTemplateNode(
        "ms-order-service",
        "Order Service",
        "pill",
        "#331B00",
        { x: 260, y: 190 },
      ),
      createTemplateNode(
        "ms-order-db",
        "Orders DB",
        "cylinder",
        "#062822",
        { x: 296, y: 320 },
      ),
      createTemplateNode(
        "ms-payment-service",
        "Payment Service",
        "pill",
        "#0F2E18",
        { x: 490, y: 190 },
      ),
      createTemplateNode(
        "ms-payment-gateway",
        "Payment Gateway",
        "rectangle",
        "#1F1F1F",
        { x: 490, y: 320 },
      ),
    ],
    edges: [
      createTemplateEdge("e-gw-auth", "ms-gateway", "ms-auth-service", "Auth"),
      createTemplateEdge("e-auth-db", "ms-auth-service", "ms-auth-db", "Queries"),
      createTemplateEdge("e-gw-order", "ms-gateway", "ms-order-service", "Routes"),
      createTemplateEdge("e-order-db", "ms-order-service", "ms-order-db", "Persists"),
      createTemplateEdge(
        "e-order-payment",
        "ms-order-service",
        "ms-payment-service",
        "Process",
      ),
      createTemplateEdge(
        "e-payment-ext",
        "ms-payment-service",
        "ms-payment-gateway",
        "External",
      ),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Decoupled event producers, distributed streaming broker, and specialized asynchronous event consumers.",
    nodes: [
      createTemplateNode(
        "ed-producer",
        "Ingestion API",
        "pill",
        "#10233D",
        { x: 30, y: 154 },
      ),
      createTemplateNode(
        "ed-broker",
        "Event Broker",
        "diamond",
        "#331B00",
        { x: 270, y: 112 },
      ),
      createTemplateNode(
        "ed-worker-notif",
        "Notification Worker",
        "pill",
        "#0F2E18",
        { x: 470, y: 30 },
      ),
      createTemplateNode(
        "ed-worker-analytics",
        "Analytics Consumer",
        "pill",
        "#062822",
        { x: 470, y: 154 },
      ),
      createTemplateNode(
        "ed-worker-audit",
        "Audit Logger",
        "pill",
        "#2E1938",
        { x: 470, y: 278 },
      ),
      createTemplateNode(
        "ed-analytics-db",
        "Data Lake",
        "cylinder",
        "#062822",
        { x: 710, y: 130 },
      ),
      createTemplateNode(
        "ed-audit-store",
        "S3 Archive",
        "cylinder",
        "#1F1F1F",
        { x: 710, y: 254 },
      ),
    ],
    edges: [
      createTemplateEdge(
        "e-prod-broker",
        "ed-producer",
        "ed-broker",
        "Publish",
      ),
      createTemplateEdge(
        "e-broker-notif",
        "ed-broker",
        "ed-worker-notif",
        "Events",
      ),
      createTemplateEdge(
        "e-broker-analytics",
        "ed-broker",
        "ed-worker-analytics",
        "Stream",
      ),
      createTemplateEdge(
        "e-broker-audit",
        "ed-broker",
        "ed-worker-audit",
        "Audit log",
      ),
      createTemplateEdge(
        "e-analytics-lake",
        "ed-worker-analytics",
        "ed-analytics-db",
        "Store",
      ),
      createTemplateEdge(
        "e-audit-archive",
        "ed-worker-audit",
        "ed-audit-store",
        "Cold storage",
      ),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Automated build, test, security analysis, artifact storage, and staged cluster deployment pipeline.",
    nodes: [
      createTemplateNode(
        "ci-git",
        "Source Git Repo",
        "circle",
        "#10233D",
        { x: 30, y: 130 },
      ),
      createTemplateNode(
        "ci-trigger",
        "Pipeline Trigger",
        "diamond",
        "#2E1938",
        { x: 174, y: 108 },
      ),
      createTemplateNode(
        "ci-build",
        "Build & Test",
        "pill",
        "#331B00",
        { x: 362, y: 150 },
      ),
      createTemplateNode(
        "ci-scan",
        "Security Scan",
        "pill",
        "#3C1618",
        { x: 602, y: 50 },
      ),
      createTemplateNode(
        "ci-registry",
        "Image Registry",
        "cylinder",
        "#062822",
        { x: 638, y: 220 },
      ),
      createTemplateNode(
        "ci-staging",
        "Staging Deploy",
        "rectangle",
        "#0F2E18",
        { x: 842, y: 138 },
      ),
      createTemplateNode(
        "ci-production",
        "Production Deploy",
        "rectangle",
        "#0F2E18",
        { x: 1082, y: 138 },
      ),
    ],
    edges: [
      createTemplateEdge("e-git-trigger", "ci-git", "ci-trigger", "Push / PR"),
      createTemplateEdge(
        "e-trigger-build",
        "ci-trigger",
        "ci-build",
        "Start job",
      ),
      createTemplateEdge("e-build-scan", "ci-build", "ci-scan", "SAST / DAST"),
      createTemplateEdge("e-build-reg", "ci-build", "ci-registry", "Push image"),
      createTemplateEdge(
        "e-reg-staging",
        "ci-registry",
        "ci-staging",
        "Deploy image",
      ),
      createTemplateEdge(
        "e-staging-prod",
        "ci-staging",
        "ci-production",
        "Promote",
      ),
    ],
  },
];
