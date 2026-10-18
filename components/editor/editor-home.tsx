"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorHomeProps {
  onCreateProject: () => void;
}

export function EditorHome({ onCreateProject }: EditorHomeProps) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-xl font-medium text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-secondary">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
        <Button type="button" className="mt-2" onClick={onCreateProject}>
          <Plus className="size-5" />
          New Project
        </Button>
      </div>
    </div>
  );
}
