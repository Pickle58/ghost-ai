"use client";

import {
  Loader2,
  MessageSquareText,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AiChatFeedMessage } from "@/hooks/use-ai-chat-feed";
import { NODE_COLORS } from "@/types/canvas";
import { cn } from "cn";

export type SidebarChatMode = "architect" | "chat";

interface AiSidebarChatPanelProps {
  mode: SidebarChatMode;
  messages: AiChatFeedMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  isComposerLocked: boolean;
  isGenerationActive: boolean;
  sendError: string | null;
  showStatusStrip: boolean;
  statusText: string | null;
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const CHAT_GREEN = NODE_COLORS[6].text;
const CHAT_GREEN_INK = "var(--bg-base)";

function formatChatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function composerPlaceholder(mode: SidebarChatMode): string {
  switch (mode) {
    case "architect":
      return "Describe the system you want to build...";
    case "chat":
      return "Message the room...";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function ChatEmptyState({
  mode,
  onDraftChange,
}: {
  mode: SidebarChatMode;
  onDraftChange: (value: string) => void;
}) {
  switch (mode) {
    case "architect":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border-subtle bg-elevated text-brand">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-copy-primary">
              Turn your project into a system design.
            </p>
            <p className="text-xs leading-5 text-copy-muted">
              Describe the architecture you want to explore, and Ghost AI can
              sketch the relevant services, flows, and boundaries.
            </p>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-border-subtle bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-elevated"
                onClick={() => onDraftChange(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      );
    case "chat":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border-subtle bg-elevated text-brand">
            <MessageSquareText className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-copy-primary">
              Room chat
            </p>
            <p className="text-xs leading-5 text-copy-muted">
              Send messages to everyone in this project. Design prompts on AI
              Architect still generate the canvas.
            </p>
          </div>
        </div>
      );
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function AiSidebarChatPanel({
  mode,
  messages,
  draft,
  onDraftChange,
  onSubmit,
  isComposerLocked,
  isGenerationActive,
  sendError,
  showStatusStrip,
  statusText,
}: AiSidebarChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(160, textareaRef.current.scrollHeight)}px`;
  }, [draft]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container || messages.length === 0) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={messagesContainerRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <ChatEmptyState mode={mode} onDraftChange={onDraftChange} />
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6",
                    message.role === "user"
                      ? "border-transparent"
                      : "border-border-subtle bg-elevated text-copy-primary",
                  )}
                  style={
                    message.role === "user"
                      ? { backgroundColor: CHAT_GREEN, color: CHAT_GREEN_INK }
                      : undefined
                  }
                >
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span
                      className={cn(
                        "truncate font-medium",
                        message.role === "user"
                          ? "text-current/70"
                          : "text-copy-secondary",
                      )}
                    >
                      {message.sender}
                    </span>
                    <time
                      className={cn(
                        "shrink-0",
                        message.role === "user"
                          ? "text-current/60"
                          : "text-copy-muted",
                      )}
                      dateTime={new Date(message.timestamp).toISOString()}
                    >
                      {formatChatTimestamp(message.timestamp)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle bg-base/95 px-3 py-3">
        {showStatusStrip ? (
          <div
            className="mb-2 flex items-center gap-2 rounded-xl border bg-base px-3 py-1.5"
            style={{ borderColor: CHAT_GREEN }}
            role="status"
            aria-live="polite"
          >
            <span
              className="size-1.5 shrink-0 animate-pulse rounded-full"
              style={{ backgroundColor: CHAT_GREEN }}
              aria-hidden="true"
            />
            <p className="truncate text-xs" style={{ color: CHAT_GREEN }}>
              {statusText ?? "Working"}
            </p>
          </div>
        ) : null}
        <div className="flex items-end gap-2 rounded-2xl border border-border-subtle bg-elevated px-2.5 py-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            placeholder={composerPlaceholder(mode)}
            disabled={isComposerLocked}
            className="min-h-[72px] max-h-[160px] resize-none border-0 bg-transparent px-0 py-1 text-sm text-copy-primary shadow-none placeholder:text-copy-muted focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                return;
              }

              event.preventDefault();
              onSubmit();
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: CHAT_GREEN, color: CHAT_GREEN_INK }}
            aria-label={isGenerationActive ? "Generation in progress" : "Send message"}
            onClick={onSubmit}
            disabled={!draft.trim() || isComposerLocked}
          >
            {isComposerLocked ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </Button>
        </div>
        {sendError ? (
          <p className="mt-2 px-1 text-xs text-state-error" role="alert">
            {sendError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
