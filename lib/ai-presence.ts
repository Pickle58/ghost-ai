export const AI_STATUS_FEED_ID = "ai-status-feed";
export const AI_CHAT_FEED_ID = "ai-chat";
export const AI_USER_ID_PREFIX = "ghost-ai";
export const AI_ARCHITECT_NAME = "AI Architect";
export const AI_ARCHITECT_COLOR = "#6457F9";

export function isAiUserId(userId: string | undefined): boolean {
  return typeof userId === "string" && userId.startsWith(`${AI_USER_ID_PREFIX}-`);
}
