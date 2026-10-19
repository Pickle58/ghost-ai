"use client";

import type { ReactNode } from "react";

import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";
import type { ProjectSummary } from "@/components/editor/project-summary";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";

interface EditorWorkspaceProps {
  ownedProjects: readonly ProjectSummary[];
  sharedProjects: readonly ProjectSummary[];
  center?: ReactNode;
  actions?: ReactNode;
  activeProjectId?: string;
  children?: ReactNode;
}

export function EditorWorkspace({
  ownedProjects,
  sharedProjects,
  center,
  actions,
  activeProjectId,
  children,
}: EditorWorkspaceProps) {
  const {
    dialog,
    activeProject,
    name,
    setName,
    roomId,
    isLoading,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submit,
  } = useProjectActions();

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeDialog();
    }
  }

  return (
    <>
      <EditorShell
        center={center}
        actions={actions}
        activeProjectId={activeProjectId}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      >
        {children ?? <EditorHome onCreateProject={openCreate} />}
      </EditorShell>
      <CreateProjectDialog
        open={dialog === "create"}
        name={name}
        roomId={roomId}
        error={error}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
      <RenameProjectDialog
        open={dialog === "rename"}
        name={name}
        currentName={activeProject?.name ?? ""}
        error={error}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
      <DeleteProjectDialog
        open={dialog === "delete"}
        projectName={activeProject?.name ?? ""}
        error={error}
        isLoading={isLoading}
        onOpenChange={handleOpenChange}
        onConfirm={submit}
      />
    </>
  );
}
