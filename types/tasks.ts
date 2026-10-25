import { z } from "zod";

export const aiStatusFeedPayloadSchema = z.object({
  kind: z.string().optional(),
  stage: z.string().optional(),
  message: z.string().optional(),
  text: z.string().optional(),
  createdAt: z.number().optional(),
});

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export function parseAiStatusFeedPayload(
  data: unknown,
): AiStatusFeedPayload | null {
  const parsed = aiStatusFeedPayloadSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function getAiStatusFeedText(
  payload: AiStatusFeedPayload,
): string | null {
  const value = payload.text ?? payload.message;

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function isActiveAiStatus(payload: AiStatusFeedPayload | null): boolean {
  if (!payload) {
    return false;
  }

  return payload.stage === "start" || payload.stage === "processing";
}

export const aiChatRoleSchema = z.enum(["user", "assistant"]);

export const aiChatMessageSchema = z.object({
  sender: z.string().min(1),
  role: aiChatRoleSchema,
  content: z.string().min(1),
  timestamp: z.number(),
});

export type AiChatRole = z.infer<typeof aiChatRoleSchema>;
export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export function createAiChatMessage(input: {
  sender: string;
  role: AiChatRole;
  content: string;
  timestamp?: number;
}): AiChatMessage {
  return {
    sender: input.sender,
    role: input.role,
    content: input.content,
    timestamp: input.timestamp ?? Date.now(),
  };
}

export function parseAiChatMessage(data: unknown): AiChatMessage | null {
  const parsed = aiChatMessageSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
