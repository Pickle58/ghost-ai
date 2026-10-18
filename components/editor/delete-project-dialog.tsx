"use client";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";

interface DeleteProjectDialogProps {
  open: boolean;
  projectName: string;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  projectName,
  isLoading,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <EditorDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description={`Delete ${projectName}? This cannot be undone.`}
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
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </>
      }
    />
  );
}
