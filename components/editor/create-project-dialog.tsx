"use client";

import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  roomId: string;
  error: string | null;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
  error,
  isLoading,
  onNameChange,
  onOpenChange,
  onSubmit,
}: CreateProjectDialogProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const roomIdMissing = name.trim().length > 0 && roomId.length === 0;

  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Project"
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
            form="create-project-form"
            disabled={
              isLoading || name.trim().length === 0 || roomId.length === 0
            }
          >
            Create
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        className="flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor="create-project-name"
          className="flex flex-col gap-2 text-sm text-copy-secondary"
        >
          Project name
          <Input
            id="create-project-name"
            value={name}
            autoComplete="off"
            disabled={isLoading}
            aria-invalid={roomIdMissing}
            aria-describedby={
              roomIdMissing ? "create-project-room-error" : undefined
            }
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span
            id="create-project-room-label"
            className="text-xs text-copy-muted"
          >
            Room ID
          </span>
          <p
            aria-labelledby="create-project-room-label"
            aria-live="polite"
            className="min-h-5 font-mono text-sm break-all text-copy-secondary"
          >
            {roomId}
          </p>
          {roomIdMissing ? (
            <p id="create-project-room-error" className="text-sm text-state-error">
              Use at least one letter or number.
            </p>
          ) : null}
          {error ? <p className="text-sm text-state-error">{error}</p> : null}
        </div>
      </form>
    </EditorDialog>
  );
}
