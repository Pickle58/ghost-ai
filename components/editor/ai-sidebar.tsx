"use client";

import { Bot, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AiSidebarChatPanel } from "@/components/editor/ai-sidebar-chat-panel";
import { AiSidebarSpecsPanel } from "@/components/editor/ai-sidebar-specs-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiChatFeed } from "@/hooks/use-ai-chat-feed";
import { useAiPresence } from "@/hooks/use-ai-presence";
import {
  getDesignRunSettlement,
  useDesignRun,
} from "@/hooks/use-design-run";
import { useLatestAiStatus } from "@/hooks/use-latest-ai-status";
import { AI_ARCHITECT_NAME } from "@/lib/ai-presence";
import { cn } from "cn";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  const [activeTab, setActiveTab] = useState("architect");
  const [architectDraft, setArchitectDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const handledRunIdRef = useRef<string | null>(null);
  const isAiThinking = useAiPresence(projectId);
  const latestStatus = useLatestAiStatus();
  const {
    messages,
    sendMessage,
    isSending,
    sendError,
  } = useAiChatFeed();
  const {
    runId,
    run,
    error: runError,
    isRunActive,
    startDesignRun,
    resetDesignRun,
  } = useDesignRun();
  const isGenerationActive = isAiThinking || latestStatus.isActive || isRunActive;
  const isComposerLocked = isGenerationActive || isSending;
  const showStatusStrip = isGenerationActive;

  useEffect(() => {
    if (!runId) {
      return;
    }

    if (handledRunIdRef.current === runId) {
      return;
    }

    if (runError && !run) {
      handledRunIdRef.current = runId;
      void (async () => {
        await sendMessage(runError.message || "Could not track the design run.", {
          role: "assistant",
          sender: AI_ARCHITECT_NAME,
        });
        resetDesignRun();
      })();
      return;
    }

    if (!run) {
      return;
    }

    const settlement = getDesignRunSettlement({
      status: run.status,
      output: run.output,
      errorMessage: runError?.message,
    });

    if (!settlement) {
      return;
    }

    handledRunIdRef.current = runId;
    void (async () => {
      await sendMessage(settlement.message, {
        role: "assistant",
        sender: AI_ARCHITECT_NAME,
      });
      resetDesignRun();
    })();
  }, [resetDesignRun, run, runError, runId, sendMessage]);

  const handleArchitectSubmit = () => {
    const trimmed = architectDraft.trim();

    if (!trimmed || isComposerLocked) {
      return;
    }

    void (async () => {
      const sent = await sendMessage(trimmed);

      if (!sent) {
        return;
      }

      setArchitectDraft("");

      const started = await startDesignRun(trimmed, projectId);

      if (!started.ok) {
        await sendMessage(started.error, {
          role: "assistant",
          sender: AI_ARCHITECT_NAME,
        });
      }
    })();
  };

  const handleChatSubmit = () => {
    const trimmed = chatDraft.trim();

    if (!trimmed || isComposerLocked) {
      return;
    }

    void (async () => {
      const sent = await sendMessage(trimmed);

      if (!sent) {
        return;
      }

      setChatDraft("");
    })();
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
            {isAiThinking ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ai-text">
                <span
                  className="size-1.5 shrink-0 rounded-full bg-ai-text"
                  aria-hidden="true"
                />
                Working
              </p>
            ) : (
              <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
            )}
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
          <TabsList className="grid w-full grid-cols-3 bg-subtle p-1 text-copy-muted">
            <TabsTrigger
              value="architect"
              className="rounded-md data-[active]:bg-accent data-[active]:text-accent-foreground data-[active]:shadow-sm"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-md data-[active]:bg-accent data-[active]:text-accent-foreground data-[active]:shadow-sm"
            >
              Chat
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
          <AiSidebarChatPanel
            mode="architect"
            messages={messages}
            draft={architectDraft}
            onDraftChange={setArchitectDraft}
            onSubmit={handleArchitectSubmit}
            isComposerLocked={isComposerLocked}
            isGenerationActive={isGenerationActive}
            sendError={sendError}
            showStatusStrip={showStatusStrip}
            statusText={latestStatus.text}
          />
        </TabsContent>

        <TabsContent value="chat" className="flex min-h-0 flex-1 flex-col">
          <AiSidebarChatPanel
            mode="chat"
            messages={messages}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onSubmit={handleChatSubmit}
            isComposerLocked={isComposerLocked}
            isGenerationActive={isGenerationActive}
            sendError={sendError}
            showStatusStrip={showStatusStrip}
            statusText={latestStatus.text}
          />
        </TabsContent>

        <TabsContent value="specs" className="flex min-h-0 flex-1 flex-col">
          <AiSidebarSpecsPanel
            projectId={projectId}
            isActive={activeTab === "specs"}
            chatHistory={messages}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
