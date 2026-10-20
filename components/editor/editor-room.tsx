"use client";

import { PanelRightClose, PanelRightOpen, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";

import { CanvasRoom } from "@/components/canvas/canvas-room";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import type { ProjectSummary } from "@/components/editor/project-summary";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";

interface EditorRoomProps {
  project: ProjectSummary;
  canManage: boolean;
  ownedProjects: readonly ProjectSummary[];
  sharedProjects: readonly ProjectSummary[];
}

export function EditorRoom({
  project,
  canManage,
  ownedProjects,
  sharedProjects,
}: EditorRoomProps) {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <EditorWorkspace
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
        center={
          <h1 className="min-w-0 max-w-full truncate px-3 text-sm font-medium text-copy-primary">
            {project.name}
          </h1>
        }
        actions={
          <RoomActions
            isShareOpen={isShareOpen}
            onShare={() => setIsShareOpen(true)}
            isAiOpen={isAiOpen}
            onToggleAi={() => setIsAiOpen((open) => !open)}
          />
        }
      >
        <div className="relative h-full bg-base">
          <CanvasRoom roomId={project.id} />
          <AiSidebar isOpen={isAiOpen} />
        </div>
      </EditorWorkspace>
      <ShareDialog
        open={isShareOpen}
        projectId={project.id}
        canManage={canManage}
        onOpenChange={setIsShareOpen}
      />
    </>
  );
}

interface RoomActionsProps {
  isShareOpen: boolean;
  onShare: () => void;
  isAiOpen: boolean;
  onToggleAi: () => void;
}

function RoomActions({
  isShareOpen,
  onShare,
  isAiOpen,
  onToggleAi,
}: RoomActionsProps) {
  const aiLabel = isAiOpen ? "Close AI sidebar" : "Open AI sidebar";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Share"
        aria-haspopup="dialog"
        aria-expanded={isShareOpen}
        onClick={onShare}
      >
        <Share2 className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={aiLabel}
        aria-expanded={isAiOpen}
        aria-controls="ai-sidebar"
        onClick={onToggleAi}
      >
        {isAiOpen ? (
          <PanelRightClose className="size-5" />
        ) : (
          <PanelRightOpen className="size-5" />
        )}
      </Button>
    </>
  );
}

interface AiSidebarProps {
  isOpen: boolean;
}

function AiSidebar({ isOpen }: AiSidebarProps) {
  return (
    <aside
      id="ai-sidebar"
      aria-label="AI"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute inset-y-3 right-3 z-30 flex w-80 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/90 shadow-xl backdrop-blur-md transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none translate-x-[calc(100%+1.5rem)]",
      )}
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-medium text-copy-primary">AI</h2>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-center text-sm text-copy-muted">
          AI chat will appear here.
        </p>
      </div>
    </aside>
  );
}
