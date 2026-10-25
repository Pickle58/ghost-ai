"use client";

import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
} from "@liveblocks/react";
import { useCallback, useMemo, useState } from "react";

import { AI_CHAT_FEED_ID } from "@/lib/ai-presence";
import {
  createAiChatMessage,
  parseAiChatMessage,
  type AiChatMessage,
  type AiChatRole,
} from "@/types/tasks";

export interface AiChatFeedMessage extends AiChatMessage {
  id: string;
}

export function useAiChatFeed() {
  const { messages, error } = useFeedMessages(AI_CHAT_FEED_ID);
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const self = useSelf();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const chatMessages = useMemo(() => {
    if (error || !messages) {
      return [];
    }

    const parsed: AiChatFeedMessage[] = [];

    for (const message of messages) {
      const payload = parseAiChatMessage(message.data);

      if (!payload) {
        continue;
      }

      parsed.push({
        id: message.id,
        ...payload,
      });
    }

    return parsed;
  }, [error, messages]);

  const sendMessage = useCallback(
    async (
      content: string,
      options?: {
        role?: AiChatRole;
        sender?: string;
      },
    ) => {
      const trimmed = content.trim();

      if (trimmed === "") {
        return false;
      }

      setIsSending(true);
      setSendError(null);

      try {
        try {
          await createFeed(AI_CHAT_FEED_ID, {
            metadata: { kind: "chat" },
          });
        } catch {
          // The feed may already exist in this room.
        }

        const role = options?.role ?? "user";
        const sender = options?.sender?.trim() || self?.info.name.trim() || "Anonymous";
        const payload = createAiChatMessage({
          sender,
          role,
          content: trimmed,
        });

        await createFeedMessage(AI_CHAT_FEED_ID, payload);
        return true;
      } catch {
        setSendError("Could not send the message. Try again.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [createFeed, createFeedMessage, self],
  );

  return {
    messages: chatMessages,
    sendMessage,
    isSending,
    sendError,
  };
}
