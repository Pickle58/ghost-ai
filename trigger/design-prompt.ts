import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

import type { DesignCanvasSnapshot } from "./design-logic";

export function buildDesignPrompt(input: {
  prompt: string;
  canvas?: DesignCanvasSnapshot;
}): string {
  return [
    "You create a valid collaborative architecture diagram from a user prompt.",
    "Return valid JSON using the supplied schema.",
    `Allowed node shapes: ${NODE_SHAPES.join(", ")}.`,
    `Allowed node fill colors: ${NODE_COLORS.map((color) => color.fill).join(", ")}.`,
    "Use add-node, move-node, resize-node, update-node-data, delete-node, add-edge, and delete-edge.",
    "Give every new node an explicit position and size. Space nodes at least 260px apart horizontally and 160px apart vertically.",
    "Keep node and edge labels short and architecture-specific.",
    "Give every add-edge a short protocol or flow label such as HTTP, Read/Write, Publish Event, Product API, or browse. Never leave an edge unlabeled.",
    "For e-commerce, ecommerce, commerce, shop, storefront, or checkout requests, include these bounded contexts: Storefront, API Gateway, Catalog Service, Cart Service, Checkout Service, Payment Service, Inventory Service, Notification Service, Webhook Worker, and Orders DB. Connect them with flow-specific edges such as browse, cart, checkout, pay, reserve, webhook, and notify instead of a single request/data chain.",
    input.canvas
      ? `Current canvas JSON: ${JSON.stringify(input.canvas)}`
      : "The canvas is currently empty.",
    `User request: ${input.prompt}`,
  ].join("\n");
}
