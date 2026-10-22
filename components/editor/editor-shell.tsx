"use client";

import { useRef, useState, type ReactNode } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import type { ProjectSummary } from "@/components/editor/project-summary";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

interface EditorShellProps {
  children?: ReactNode;
  center?: ReactNode;
  actions?: ReactNode;
  activeProjectId?: string;
  ownedProjects: readonly ProjectSummary[];
  sharedProjects: readonly ProjectSummary[];
  showAuth?: boolean;
  onCreateProject: () => void;
  onRenameProject: (project: ProjectSummary) => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

export function EditorShell({
  children,
  center,
  actions,
  activeProjectId,
  ownedProjects,
  sharedProjects,
  showAuth,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        sidebarToggleRef={sidebarToggleRef}
        center={center}
        actions={actions}
        showAuth={showAuth}
      />
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{children}</div>
        <ProjectSidebar
          isOpen={isSidebarOpen}
          activeProjectId={activeProjectId}
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
