"use client";

import { useRef, useState, type ReactNode } from "react";

import type { ProjectSummary } from "@/components/editor/mock-projects";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children?: ReactNode;
  center?: ReactNode;
  projects: readonly ProjectSummary[];
  onCreateProject: () => void;
  onRenameProject: (project: ProjectSummary) => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

export function EditorShell({
  children,
  center,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        sidebarToggleRef={sidebarToggleRef}
        center={center}
      />
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{children}</div>
        <ProjectSidebar
          isOpen={isSidebarOpen}
          projects={projects}
          onCreateProject={onCreateProject}
          onRenameProject={onRenameProject}
          onDeleteProject={onDeleteProject}
          onClose={() => {
            setIsSidebarOpen(false);
            sidebarToggleRef.current?.focus();
          }}
        />
      </div>
    </div>
  );
}
