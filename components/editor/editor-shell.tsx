"use client";

import { useRef, useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import type { ProjectSummary } from "@/components/editor/project-summary";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children?: ReactNode;
  center?: ReactNode;
  ownedProjects: readonly ProjectSummary[];
  sharedProjects: readonly ProjectSummary[];
  onCreateProject: () => void;
  onRenameProject: (project: ProjectSummary) => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

export function EditorShell({
  children,
  center,
  ownedProjects,
  sharedProjects,
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
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
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
