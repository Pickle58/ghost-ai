"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { shallow, useOthers } from "@liveblocks/react/suspense";
import { useMemo, useState } from "react";
import { cn } from "cn";

import { isAiUserId } from "@/lib/ai-presence";

export interface CanvasParticipantAvatarsProps {
  isAiOpen?: boolean;
  isAiThinking?: boolean;
}

export function CanvasParticipantAvatars({
  isAiOpen,
  isAiThinking,
}: CanvasParticipantAvatarsProps) {
  const { userId: currentUserId } = useAuth();

  const others = useOthers(
    (allOthers) =>
      allOthers.map((other) => ({
        connectionId: other.connectionId,
        id: other.id,
        info: other.info,
        thinking: other.presence.thinking,
      })),
    shallow,
  );

  const collaborators = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      id: string;
      name: string;
      avatar: string;
      color: string;
      thinking: boolean;
    }> = [];

    for (const other of others) {
      if (other.id && other.id !== currentUserId && !seen.has(other.id)) {
        seen.add(other.id);
        list.push({
          id: other.id,
          name: other.info?.name ?? "Collaborator",
          avatar: other.info?.avatar ?? "",
          color: other.info?.color ?? "#00c8d4",
          thinking: other.thinking,
        });
      }
    }

    return list;
  }, [others, currentUserId]);

  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = collaborators.length - 5;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div
      className={cn(
        "nodrag nopan nowheel absolute top-4 z-20 flex items-center gap-2 rounded-full border border-border-subtle/80 bg-surface/90 shadow-lg backdrop-blur-md transition-all duration-200",
        hasCollaborators ? "px-2 py-1.5" : "p-1.5",
        isAiOpen ? "right-84" : "right-4",
      )}
    >
      {hasCollaborators && (
        <div className="flex items-center -space-x-2">
          {visibleCollaborators.map((collaborator) => (
            <CollaboratorAvatar
              key={collaborator.id}
              name={collaborator.name}
              avatar={collaborator.avatar}
              color={collaborator.color}
              thinking={
                collaborator.thinking ||
                (Boolean(isAiThinking) && isAiUserId(collaborator.id))
              }
            />
          ))}
          {overflowCount > 0 && (
            <div
              className="relative flex size-8 shrink-0 select-none items-center justify-center rounded-full border border-border-subtle bg-elevated text-[11px] font-medium text-copy-secondary ring-2 ring-base"
              title={`${overflowCount} more collaborator${overflowCount > 1 ? "s" : ""}`}
              aria-label={`${overflowCount} more collaborators`}
            >
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {hasCollaborators && (
        <div
          className="h-4 w-px shrink-0 bg-border-subtle"
          aria-hidden="true"
        />
      )}

      <div className="flex size-8 shrink-0 items-center justify-center">
        <UserButton
          appearance={{
            elements: {
              rootBox: "size-8",
              userButtonAvatarBox: "size-8 ring-2 ring-base",
            },
          }}
        />
      </div>
    </div>
  );
}

interface CollaboratorAvatarProps {
  name: string;
  avatar?: string;
  color: string;
  thinking?: boolean;
}

function CollaboratorAvatar({ name, avatar, color, thinking }: CollaboratorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const showImage = Boolean(avatar) && !imageError;

  return (
    <div
      className={cn(
        "relative size-8 shrink-0 select-none overflow-hidden rounded-full border border-border-subtle/50 ring-2 ring-base",
        thinking && "ring-ai-text",
      )}
      title={thinking ? `${name} thinking` : name}
      aria-label={thinking ? `${name} thinking` : name}
    >
      {showImage ? (
        <img
          src={avatar}
          alt={name}
          className="size-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="flex size-full items-center justify-center text-[11px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
