"use client";

import {
  LayoutTemplate,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { CanvasRoom } from "@/components/canvas/canvas-room";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import type { ProjectSummary } from "@/components/editor/project-summary";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("saved");
  const saveNowRef = useRef<(() => Promise<void>) | null>(null);

  const handleSaveStatusChange = useCallback(
    (status: CanvasSaveStatus) => {
      setSaveStatus(status);
    },
    [],
  );

  const handleSaveReady = useCallback((saveNow: () => Promise<void>) => {
    saveNowRef.current = saveNow;
  }, []);

  const handleSaveNow = useCallback(() => {
    const saveNow = saveNowRef.current;
    if (saveNow) {
      void saveNow();
    }
  }, []);

  return (
    <>
      <EditorWorkspace
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
        showAuth={false}
        center={
          <h1 className="min-w-0 max-w-full truncate px-3 text-sm font-medium text-copy-primary">
            {project.name}
          </h1>
        }
        actions={
          <RoomActions
            saveStatus={saveStatus}
            onSave={handleSaveNow}
            isTemplatesOpen={isTemplatesOpen}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            isShareOpen={isShareOpen}
            onShare={() => setIsShareOpen(true)}
            isAiOpen={isAiOpen}
            onToggleAi={() => setIsAiOpen((open) => !open)}
          />
        }
      >
        <div className="relative h-full bg-base">
          <CanvasRoom
            roomId={project.id}
            isTemplatesOpen={isTemplatesOpen}
            onOpenTemplatesChange={setIsTemplatesOpen}
            isAiOpen={isAiOpen}
            onSaveStatusChange={handleSaveStatusChange}
            onSaveReady={handleSaveReady}
          />
          <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
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
  saveStatus: CanvasSaveStatus;
  onSave: () => void;
  isTemplatesOpen: boolean;
  onOpenTemplates: () => void;
  isShareOpen: boolean;
  onShare: () => void;
  isAiOpen: boolean;
  onToggleAi: () => void;
}

function RoomActions({
  saveStatus,
  onSave,
  isTemplatesOpen,
  onOpenTemplates,
  isShareOpen,
  onShare,
  isAiOpen,
  onToggleAi,
}: RoomActionsProps) {
  const aiLabel = isAiOpen ? "Close AI sidebar" : "Open AI sidebar";
  const saveLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "error"
        ? "Save failed"
        : "Saved";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="gap-1.5 px-2 text-copy-secondary"
        aria-live="polite"
        onClick={onSave}
      >
        <span className="text-sm">Save</span>
        <span
          className={
            saveStatus === "error"
              ? "text-state-error"
              : saveStatus === "saving"
                ? "text-copy-muted"
                : "text-state-success"
          }
        >
          {saveLabel}
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Starter templates"
        aria-haspopup="dialog"
        aria-expanded={isTemplatesOpen}
        onClick={onOpenTemplates}
      >
        <LayoutTemplate className="size-5" />
      </Button>
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

