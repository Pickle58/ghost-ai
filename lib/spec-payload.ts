import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type {
  GenerateSpecEdge,
  GenerateSpecNode,
  GenerateSpecRequest,
} from "@/types/spec-generation";
import type { AiChatMessage } from "@/types/tasks";

export function toSpecChatHistory(
  messages: readonly AiChatMessage[],
): AiChatMessage[] {
  return messages.map((message) => ({
    sender: message.sender,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }));
}

export function toSpecGenerateRequest(
  roomId: string,
  messages: readonly AiChatMessage[],
): GenerateSpecRequest {
  return {
    roomId,
    chatHistory: toSpecChatHistory(messages),
  };
}

export function toSpecNodes(nodes: readonly CanvasNode[]): GenerateSpecNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    width: node.width,
    height: node.height,
    data: {
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
    },
  }));
}

export function toSpecEdges(edges: readonly CanvasEdge[]): GenerateSpecEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: {
      label: edge.data?.label,
    },
  }));
}
