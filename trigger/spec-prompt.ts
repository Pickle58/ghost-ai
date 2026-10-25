import type {
  GenerateSpecEdge,
  GenerateSpecNode,
  GenerateSpecTaskInput,
} from "@/types/spec-generation";

export interface SpecPromptInput extends GenerateSpecTaskInput {
  nodes: GenerateSpecNode[];
  edges: GenerateSpecEdge[];
}

export function buildSpecPrompt(input: SpecPromptInput): string {
  const nodes = input.nodes.map((node) => ({
    id: node.id,
    label: node.data?.label ?? "",
    shape: node.data?.shape,
    color: node.data?.color,
    x: node.position?.x,
    y: node.position?.y,
  }));
  const edges = input.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.data?.label ?? "",
  }));
  const chatHistory = input.chatHistory.map((message) => ({
    sender: message.sender,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }));

  return [
    "You write a Markdown technical specification from a collaborative system-design canvas.",
    "Use the canvas graph and chat history as the only sources of truth.",
    "Write complete Markdown. Do not wrap the document in a code fence.",
    "Include these sections when the source material supports them: Overview, Components, Connections, Data flow, and Open questions.",
    "If the canvas is empty, say so and keep the spec brief.",
    `Project id: ${input.projectId}`,
    `Room id: ${input.roomId}`,
    `Canvas nodes JSON: ${JSON.stringify(nodes)}`,
    `Canvas edges JSON: ${JSON.stringify(edges)}`,
    `Chat history JSON: ${JSON.stringify(chatHistory)}`,
  ].join("\n");
}
