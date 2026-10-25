"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useOther,
  useOthersConnectionIds,
} from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";
import { Loader2 } from "lucide-react";

export function LiveCursors() {
  const othersConnectionIds = useOthersConnectionIds();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {othersConnectionIds.map((connectionId) => (
        <LiveCursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  );
}

interface LiveCursorProps {
  connectionId: number;
}

function LiveCursor({ connectionId }: LiveCursorProps) {
  const { userId: currentUserId } = useAuth();
  const otherUserId = useOther(connectionId, (other) => other.id);
  const cursor = useOther(connectionId, (other) => other.presence.cursor);
  const thinking = useOther(connectionId, (other) => other.presence.thinking);
  const info = useOther(connectionId, (other) => other.info);
  const { x: panX, y: panY, zoom } = useViewport();
  const isThinking = thinking === true;

  if (!cursor || (currentUserId && otherUserId === currentUserId)) {
    return null;
  }

  const x = cursor.x * zoom + panX;
  const y = cursor.y * zoom + panY;
  const color = info?.color ?? "#00c8d4";
  const name = info?.name ?? "Collaborator";

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
    >
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
        className="drop-shadow-sm"
      >
        <path
          d="M0 0L6 18L9.5 11.5L15 10L0 0Z"
          fill="currentColor"
          stroke="#080809"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute left-3.5 top-3.5 flex items-center gap-1 select-none rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none text-white shadow-md whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {isThinking ? (
          <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" />
        ) : null}
        <span>{name}</span>
      </div>
    </div>
  );
}
