"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { ProjectSummary } from "@/components/editor/project-summary";
import { createRoomSuffix, toRoomId } from "@/lib/project-slug";

export type ProjectDialog = "create" | "rename" | "delete";

export function useProjectActions() {
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<ProjectDialog | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectSummary | null>(
    null,
  );
  const [name, setNameState] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomId = toRoomId(name, suffix);

  function setName(nextName: string) {
    setNameState(nextName);
    setError(null);
  }

  function openCreate() {
    if (isLoading) {
      return;
    }

    setActiveProject(null);
    setNameState("");
    setSuffix(createRoomSuffix());
    setError(null);
    setDialog("create");
  }

  function openRename(project: ProjectSummary) {
    if (isLoading) {
      return;
    }

    setActiveProject(project);
    setNameState(project.name);
    setError(null);
    setDialog("rename");
  }

  function openDelete(project: ProjectSummary) {
    if (isLoading) {
      return;
    }

    setActiveProject(project);
    setNameState(project.name);
    setError(null);
    setDialog("delete");
  }

  function closeDialog() {
    if (isLoading) {
      return;
    }

    setDialog(null);
    setError(null);
  }

  async function submit() {
    if (isLoading || !canSubmit(dialog, name, roomId, activeProject)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      switch (dialog) {
        case "create":
          await createProject(name, roomId);
          return;
        case "rename":
          await renameProject(activeProject, name);
          return;
        case "delete":
          await deleteProject(activeProject, pathname);
          return;
        case null:
          return;
        default: {
          const exhaustive: never = dialog;
          return exhaustive;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject(projectName: string, nextRoomId: string) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), id: nextRoomId }),
      });

      if (response.status === 409) {
        setSuffix(createRoomSuffix());
        setError("That room ID was taken. Review the new one and try again.");
        return;
      }

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      const projectId = await readProjectId(response);
      if (projectId !== nextRoomId) {
        setError("Something went wrong. Try again.");
        return;
      }

      setDialog(null);
      router.push(`/editor/${projectId}`);
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  async function renameProject(
    project: ProjectSummary | null,
    projectName: string,
  ) {
    if (!project) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projectName.trim() }),
        },
      );

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      setDialog(null);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  async function deleteProject(
    project: ProjectSummary | null,
    currentPath: string,
  ) {
    if (!project) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(project.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      setDialog(null);
      if (isActiveWorkspace(currentPath, project.id)) {
        router.push("/editor");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    }
  }

  return {
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
  };
}

function canSubmit(
  dialog: ProjectDialog | null,
  name: string,
  roomId: string,
  activeProject: ProjectSummary | null,
): boolean {
  switch (dialog) {
    case "create":
      return name.trim().length > 0 && roomId.length > 0;
    case "rename":
      return activeProject !== null && name.trim().length > 0;
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

function isActiveWorkspace(pathname: string, projectId: string): boolean {
  const workspacePath = `/editor/${projectId}`;
  return pathname === workspacePath || pathname.startsWith(`${workspacePath}/`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readProjectId(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body) || !isRecord(body.project)) {
      return null;
    }

    return typeof body.project.id === "string" ? body.project.id : null;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      isRecord(body) &&
      typeof body.error === "string" &&
      body.error.trim() !== ""
    ) {
      return body.error;
    }
  } catch {
    return "Something went wrong. Try again.";
  }

  return "Something went wrong. Try again.";
}
