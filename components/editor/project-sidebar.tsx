"use client";

import { Plus, X } from "lucide-react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
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
        <TabsContent
          value="mine"
          className="flex items-center justify-center px-4"
        >
          <p className="text-sm text-copy-muted">No projects yet.</p>
        </TabsContent>
        <TabsContent
          value="shared"
          className="flex items-center justify-center px-4"
        >
          <p className="text-sm text-copy-muted">No shared projects yet.</p>
        </TabsContent>
      </Tabs>

      <div className="border-t border-border-subtle p-3">
        <Button type="button" className="w-full">
          <Plus className="size-5" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
