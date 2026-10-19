"use client";

import type { FormEvent, KeyboardEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameProjectDialogProps {
  open: boolean;
  name: string;
  currentName: string;
  error: string | null;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  open,
  name,
  currentName,
  error,
  isLoading,
  onNameChange,
  onOpenChange,
  onSubmit,
}: RenameProjectDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    onSubmit();
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename Project"
      description={`Current name: ${currentName}`}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="rename-project-form"
            disabled={isLoading || name.trim().length === 0}
          >
            Rename
          </Button>
        </>
      }
    >
      <form id="rename-project-form" onSubmit={handleSubmit}>
        <label
          htmlFor="rename-project-name"
          className="flex flex-col gap-2 text-sm text-copy-secondary"
        >
          Project name
          <Input
            id="rename-project-name"
            value={name}
            autoFocus
            autoComplete="off"
            disabled={isLoading}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={handleNameKeyDown}
          />
        </label>
        {error ? <p className="mt-3 text-sm text-state-error">{error}</p> : null}
      </form>
    </EditorDialog>
  );
}
