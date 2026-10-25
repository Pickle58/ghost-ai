"use client";

import { useOthers } from "@liveblocks/react";

import { isAiUserId } from "@/lib/ai-presence";

export function useAiPresence(_projectId?: string): boolean {
  const others = useOthers();

  if (!others) {
    return false;
  }

  return others.some(
    (other) => isAiUserId(other.id) && other.presence.thinking === true,
  );
}
