"use client";

import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorShell } from "@/components/editor/editor-shell";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

export function EditorWorkspace() {
  const {
    projects,
    dialog,
    activeProject,
    name,
    setName,
    slug,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    submit,
  } = useProjectDialogs();

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeDialog();
    }
  }

  return (
    <>
      <EditorShell
        projects={projects}
        onCreateProject={openCreate}
        onRenameProject={openRename}
        onDeleteProject={openDelete}
      >
        <EditorHome onCreateProject={openCreate} />
      </EditorShell>
      <CreateProjectDialog
        open={dialog === "create"}
        name={name}
        slug={slug}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
      <RenameProjectDialog
        open={dialog === "rename"}
        name={name}
        currentName={activeProject?.name ?? ""}
        isLoading={isLoading}
        onNameChange={setName}
        onOpenChange={handleOpenChange}
        onSubmit={submit}
      />
      <DeleteProjectDialog
        open={dialog === "delete"}
        projectName={activeProject?.name ?? ""}
        isLoading={isLoading}
        onOpenChange={handleOpenChange}
        onConfirm={submit}
      />
    </>
  );
}
