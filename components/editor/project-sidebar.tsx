"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "cn";
import Link from "next/link";

import type { ProjectSummary } from "@/components/editor/project-summary";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  activeProjectId?: string;
  ownedProjects: readonly ProjectSummary[];
  sharedProjects: readonly ProjectSummary[];
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: ProjectSummary) => void;
  onDeleteProject: (project: ProjectSummary) => void;
}

export function ProjectSidebar({
  isOpen,
  activeProjectId,
  ownedProjects,
  sharedProjects,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute inset-0 z-20 bg-background/75 md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        id="project-sidebar"
        aria-label="Projects"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "absolute inset-y-3 left-3 z-30 flex w-80 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface/90 shadow-xl backdrop-blur-md transition-transform duration-200 ease-out",
          isOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-[calc(100%+1.5rem)]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          defaultValue="mine"
          className="flex min-h-0 w-full flex-1 flex-col gap-3"
        >
          <div className="w-full px-3 pt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mine">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="mine" className="min-h-0 overflow-y-auto px-3">
            <ProjectList
              projects={ownedProjects}
              emptyLabel="No projects yet."
              activeProjectId={activeProjectId}
              onRenameProject={onRenameProject}
              onDeleteProject={onDeleteProject}
            />
          </TabsContent>
          <TabsContent value="shared" className="min-h-0 overflow-y-auto px-3">
            <ProjectList
              projects={sharedProjects}
              emptyLabel="No shared projects yet."
              activeProjectId={activeProjectId}
            />
          </TabsContent>
        </Tabs>

        <div className="border-t border-border-subtle p-3">
          <Button type="button" className="w-full" onClick={onCreateProject}>
            <Plus className="size-5" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: readonly ProjectSummary[];
  emptyLabel: string;
  activeProjectId?: string;
  onRenameProject?: (project: ProjectSummary) => void;
  onDeleteProject?: (project: ProjectSummary) => void;
}

function ProjectList({
  projects,
  emptyLabel,
  activeProjectId,
  onRenameProject,
  onDeleteProject,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-1">
        <p className="text-sm text-copy-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId;

        return (
          <li
            key={project.id}
            className={cn(
              "flex items-center gap-1 rounded-xl px-2 py-1",
              isActive && "bg-accent-dim",
            )}
          >
            <Link
              href={`/editor/${project.id}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "min-w-0 flex-1 truncate rounded-lg px-1 py-1 text-sm text-copy-primary",
                isActive && "font-medium text-brand",
              )}
            >
              {project.name}
            </Link>
            <ProjectActions
              project={project}
              onRenameProject={onRenameProject}
              onDeleteProject={onDeleteProject}
            />
          </li>
        );
      })}
    </ul>
  );
}

interface ProjectActionsProps {
  project: ProjectSummary;
  onRenameProject?: (project: ProjectSummary) => void;
  onDeleteProject?: (project: ProjectSummary) => void;
}

function ProjectActions({
  project,
  onRenameProject,
  onDeleteProject,
}: ProjectActionsProps) {
  if (!onRenameProject || !onDeleteProject) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Rename ${project.name}`}
        onClick={() => onRenameProject(project)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${project.name}`}
        onClick={() => onDeleteProject(project)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
