"use client";

import { UserMinus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useShareCollaborators,
  type ShareCollaborator,
} from "@/hooks/use-share-collaborators";

const COPIED_FEEDBACK_MS = 2000;

interface ShareDialogProps {
  open: boolean;
  projectId: string;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  open,
  projectId,
  canManage,
  onOpenChange,
}: ShareDialogProps) {
  const {
    collaborators,
    isLoading,
    isInviting,
    removingId,
    error,
    invite,
    remove,
  } = useShareCollaborators(projectId, open);
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const isBusy = isInviting || removingId !== null;

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) {
        window.clearTimeout(copiedTimer.current);
      }
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isBusy) {
      return;
    }

    if (!nextOpen) {
      setEmail("");
      setNotice(null);
      setCopied(false);
      setCopyError(null);
      if (copiedTimer.current !== null) {
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = null;
      }
    }

    onOpenChange(nextOpen);
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const result = await invite(email);
    if (result === "sent") {
      setEmail("");
      setNotice("Invitation sent.");
    }
  }

  async function copyLink() {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/editor/${projectId}`,
      );
    } catch {
      setCopied(false);
      setCopyError("Could not copy the link.");
      return;
    }

    setCopied(true);
    if (copiedTimer.current !== null) {
      window.clearTimeout(copiedTimer.current);
    }

    copiedTimer.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimer.current = null;
    }, COPIED_FEEDBACK_MS);
  }

  return (
    <EditorDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Share"
      description={
        canManage
          ? "Invite collaborators by email."
          : "You can view who has access. Only the owner can make changes."
      }
      footer={
        canManage ? (
          <Button type="button" variant="outline" onClick={() => void copyLink()}>
            <span aria-live="polite">{copied ? "Copied!" : "Copy link"}</span>
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        {canManage ? (
          <form className="flex flex-col gap-2" onSubmit={handleInvite}>
            <label htmlFor="share-email" className="text-sm text-copy-secondary">
              Email
            </label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                value={email}
                autoComplete="email"
                disabled={isInviting}
                placeholder="name@example.com"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNotice(null);
                }}
              />
              <Button
                type="submit"
                disabled={isInviting || email.trim() === ""}
              >
                Invite
              </Button>
            </div>
          </form>
        ) : null}
        {notice ? (
          <p className="text-sm text-state-success" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-state-error" role="alert">
            {error}
          </p>
        ) : null}
        {copyError ? (
          <p className="text-sm text-state-error" role="alert">
            {copyError}
          </p>
        ) : null}
        <CollaboratorList
          collaborators={collaborators}
          isLoading={isLoading}
          canManage={canManage}
          removingId={removingId}
          onRemove={(collaboratorId) => void remove(collaboratorId)}
        />
      </div>
    </EditorDialog>
  );
}

interface CollaboratorListProps {
  collaborators: readonly ShareCollaborator[];
  isLoading: boolean;
  canManage: boolean;
  removingId: string | null;
  onRemove: (collaboratorId: string) => void;
}

function CollaboratorList({
  collaborators,
  isLoading,
  canManage,
  removingId,
  onRemove,
}: CollaboratorListProps) {
  if (isLoading && collaborators.length === 0) {
    return <p className="text-sm text-copy-muted">Loading collaborators...</p>;
  }

  if (collaborators.length === 0) {
    return <p className="text-sm text-copy-muted">No collaborators yet.</p>;
  }

  return (
    <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
      {collaborators.map((collaborator) => (
        <CollaboratorRow
          key={collaborator.id}
          collaborator={collaborator}
          canManage={canManage}
          isRemoving={removingId === collaborator.id}
          onRemove={() => onRemove(collaborator.id)}
        />
      ))}
    </ul>
  );
}

interface CollaboratorRowProps {
  collaborator: ShareCollaborator;
  canManage: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}

function CollaboratorRow({
  collaborator,
  canManage,
  isRemoving,
  onRemove,
}: CollaboratorRowProps) {
  const imageUrl = avatarSrc(collaborator.imageUrl);

  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-1.5">
      {imageUrl ? (
        // Clerk avatar hosts vary, so this stays a native image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-full object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        {collaborator.name ? (
          <>
            <p className="truncate text-sm text-copy-primary">
              {collaborator.name}
            </p>
            <p className="truncate text-xs text-copy-muted">
              {collaborator.email}
            </p>
          </>
        ) : (
          <p className="truncate text-sm text-copy-primary">
            {collaborator.email}
          </p>
        )}
      </div>
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${collaborator.email}`}
          disabled={isRemoving}
          onClick={onRemove}
        >
          <UserMinus className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}

function avatarSrc(imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
