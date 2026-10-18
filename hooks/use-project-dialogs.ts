"use client";

import { useState } from "react";

import {
  mockProjects,
  type ProjectSummary,
} from "@/components/editor/mock-projects";
import { toProjectSlug } from "@/lib/project-slug";

export type ProjectDialog = "create" | "rename" | "delete";

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialog | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(
    null,
  );
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = toProjectSlug(name);

  function openCreate() {
    if (isLoading) {
      return;
    }

    setActiveProject(null);
    setName("");
    setIsLoading(false);
    setDialog("create");
  }

  function openRename(project: ProjectSummary) {
    if (isLoading || project.ownership !== "owned") {
      return;
    }

    setActiveProject(project);
    setName(project.name);
    setIsLoading(false);
    setDialog("rename");
  }

  function openDelete(project: ProjectSummary) {
    if (isLoading || project.ownership !== "owned") {
      return;
    }

    setActiveProject(project);
    setName(project.name);
    setIsLoading(false);
    setDialog("delete");
  }

  function closeDialog() {
    if (isLoading) {
      return;
    }

    setDialog(null);
  }

  function submit() {
    if (isLoading || !canSubmit(dialog, name, activeProject)) {
      return;
    }

    setIsLoading(true);
    setDialog(null);
    setIsLoading(false);
  }

  return {
    projects: mockProjects,
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
  };
}

function canSubmit(
  dialog: ProjectDialog | null,
  name: string,
  activeProject: ProjectSummary | null,
): boolean {
  switch (dialog) {
    case "create":
    case "rename":
      return name.trim().length > 0;
    case "delete":
      return activeProject !== null;
    case null:
      return false;
    default: {
      const exhaustive: never = dialog;
      return exhaustive;
    }
  }
}
