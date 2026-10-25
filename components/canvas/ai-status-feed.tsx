"use client";

import { Sparkles } from "lucide-react";
import { Component, type ReactNode } from "react";

import { useLatestAiStatus } from "@/hooks/use-latest-ai-status";
import { cn } from "cn";

class AiStatusFeedBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export function AiStatusFeed() {
  return (
    <AiStatusFeedBoundary>
      <AiStatusFeedMessage />
    </AiStatusFeedBoundary>
  );
}

function AiStatusFeedMessage() {
  const { payload, text } = useLatestAiStatus();

  if (!payload || !text) {
    return null;
  }

  const stage = payload.stage;
  const isError = stage === "error";
  const isComplete = stage === "complete";

  return (
    <div
      className={cn(
        "nodrag nopan nowheel pointer-events-none absolute top-4 left-1/2 z-20 max-w-[min(28rem,calc(100%-8rem))] -translate-x-1/2 rounded-full border px-3 py-1.5 shadow-lg backdrop-blur-md",
        isError
          ? "border-state-error/40 bg-surface/90 text-state-error"
          : isComplete
            ? "border-border-subtle/80 bg-surface/90 text-copy-secondary"
            : "border-ai/40 bg-surface/90 text-ai-text",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 shrink-0" />
        <p className="truncate text-xs font-medium">{text}</p>
      </div>
    </div>
  );
}
