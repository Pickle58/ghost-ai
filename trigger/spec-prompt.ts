import type {
  GenerateSpecEdge,
  GenerateSpecNode,
  GenerateSpecTaskInput,
} from "@/types/spec-generation";

export interface SpecPromptInput extends GenerateSpecTaskInput {
  nodes: GenerateSpecNode[];
  edges: GenerateSpecEdge[];
}

export const REQUIRED_SPEC_HEADINGS = [
  "Overview",
  "Components",
  "APIs / events",
  "Data model",
  "Authn / Authz",
  "Threat model",
  "Failure modes",
  "Open questions",
] as const;

export function missingRequiredSpecHeadings(markdown: string): string[] {
  return REQUIRED_SPEC_HEADINGS.filter((heading) => !hasSpecHeading(markdown, heading));
}

function hasSpecHeading(markdown: string, heading: string): boolean {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^#{1,6}\\s+(?:\\d+\\.\\s+)?${escaped}(?:\\s.*)?$`,
    "im",
  );
  return pattern.test(markdown);
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
    "Always write these sections, in this order:",
    "1. Overview",
    "2. Components — each component states responsibility and data owned",
    "3. APIs / events",
    "4. Data model",
    "5. Authn / Authz",
    "6. Threat model",
    "7. Failure modes",
    "8. Open questions",
    "Do not omit a section. If the canvas or chat does not support a section, write what is known and prefix inferred lines with `Assumption:`.",
    "Mark invented detail as `Assumption:` rather than staying silent.",
    `Canvas nodes JSON: ${JSON.stringify(nodes)}`,
    `Canvas edges JSON: ${JSON.stringify(edges)}`,
    `Chat history JSON: ${JSON.stringify(chatHistory)}`,
  ].join("\n");
}
