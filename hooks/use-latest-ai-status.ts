"use client";

import { useFeedMessages } from "@liveblocks/react";

import { AI_STATUS_FEED_ID } from "@/lib/ai-presence";
import {
  getAiStatusFeedText,
  isActiveAiStatus,
  parseAiStatusFeedPayload,
  type AiStatusFeedPayload,
} from "@/types/tasks";

export interface LatestAiStatus {
  payload: AiStatusFeedPayload | null;
  text: string | null;
  isActive: boolean;
}

export function useLatestAiStatus(): LatestAiStatus {
  const { messages, error } = useFeedMessages(AI_STATUS_FEED_ID);

  if (error || !messages || messages.length === 0) {
    return {
      payload: null,
      text: null,
      isActive: false,
    };
  }

  const latest = messages[messages.length - 1];
  const payload = parseAiStatusFeedPayload(latest?.data ?? null);

  if (!payload) {
    return {
      payload: null,
      text: null,
      isActive: false,
    };
  }

  return {
    payload,
    text: getAiStatusFeedText(payload),
    isActive: isActiveAiStatus(payload),
  };
}
