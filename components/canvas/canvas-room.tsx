"use client";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense";
import { Component, useState, type ReactNode } from "react";

import { FlowCanvas } from "@/components/canvas/flow-canvas";

interface CanvasRoomProps {
  roomId: string;
}

const initialPresence = {
  cursor: null,
  isThinking: false,
};

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId} initialPresence={initialPresence}>
        <div className="h-full w-full">
          <CanvasConnectionFallback>
            <CanvasErrorBoundary
              fallback={
                <CanvasMessage>The canvas could not connect.</CanvasMessage>
              }
            >
              <ClientSideSuspense
                fallback={<CanvasMessage>Loading canvas…</CanvasMessage>}
              >
                <FlowCanvas />
              </ClientSideSuspense>
            </CanvasErrorBoundary>
          </CanvasConnectionFallback>
        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CanvasConnectionFallback({ children }: { children: ReactNode }) {
  const [hasConnectionError, setHasConnectionError] = useState(false);

  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      setHasConnectionError(true);
    }
  });

  if (hasConnectionError) {
    return <CanvasMessage>The canvas could not connect.</CanvasMessage>;
  }

  return children;
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function CanvasMessage({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-base px-6">
      <p className="text-sm text-copy-muted">{children}</p>
    </div>
  );
}
