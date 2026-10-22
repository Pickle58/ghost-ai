"use client";

import {
  Bot,
  Download,
  FileText,
  MessageSquareText,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

const starterPrompts = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  const handleSubmit = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextAssistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content:
        "I can help shape that system into a collaborative architecture. Start by defining the core actors, data flows, and deployment constraints.",
    };

    setMessages((current) => [...current, nextUserMessage, nextAssistantMessage]);
    setDraft("");
  };

  return (
    <aside
      id="ai-sidebar"
      aria-label="AI workspace"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute inset-y-3 right-3 z-30 flex w-[22rem] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-base/95 shadow-xl backdrop-blur-md transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-[calc(100%+1.5rem)]",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 items-center justify-center rounded-xl border border-border-subtle bg-subtle text-brand">
            <Bot className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-copy-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-copy-muted hover:bg-subtle hover:text-copy-primary"
          aria-label="Close AI sidebar"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="border-b border-border-subtle px-3 pb-2 pt-3">
          <TabsList className="grid w-full grid-cols-2 bg-subtle p-1 text-copy-muted">
            <TabsTrigger
              value="architect"
              className="rounded-md data-[active]:bg-accent data-[active]:text-accent-foreground data-[active]:shadow-sm"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="rounded-md data-[active]:bg-accent data-[active]:text-accent-foreground data-[active]:shadow-sm"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="architect" className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              ref={messagesContainerRef}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3"
            >
              {messages.length === 0 ? (
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
                        onClick={() => setDraft(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
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
                            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                            : "border border-border-subtle bg-elevated text-ai-text",
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle bg-base/95 px-3 py-3">
              <div className="flex items-end gap-2 rounded-2xl border border-border-subtle bg-elevated px-2.5 py-2">
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  placeholder="Describe the system you want to build..."
                  className="min-h-[72px] max-h-[160px] resize-none border-0 bg-transparent px-0 py-1 text-sm text-copy-primary shadow-none placeholder:text-copy-muted focus-visible:ring-0"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                      return;
                    }

                    event.preventDefault();
                    handleSubmit();
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-accent text-white hover:bg-accent/90"
                  aria-label="Send message"
                  onClick={handleSubmit}
                  disabled={!draft.trim()}
                >
                  <SendHorizontal className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <Button type="button" className="w-full bg-accent text-white hover:bg-accent/90">
            Generate Spec
          </Button>

          <div className="rounded-2xl border border-border-subtle bg-elevated p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-subtle text-brand">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-copy-primary">
                  system-architecture-spec.md
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-copy-muted">
                  Overview, service boundaries, deployment flow, and operational
                  responsibilities for the current canvas.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-base/80 px-2.5 py-2">
              <div className="flex items-center gap-2 text-xs text-copy-muted">
                <MessageSquareText className="size-3.5" />
                <span>Draft ready</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-copy-muted hover:bg-subtle hover:text-copy-primary"
                disabled
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
