import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface LiveblocksFlowSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export async function readCanvasSnapshot(
  liveblocks: Liveblocks,
  roomId: string,
): Promise<LiveblocksFlowSnapshot> {
  let snapshot: LiveblocksFlowSnapshot = { nodes: [], edges: [] };

  await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
    snapshot = {
      nodes: [...flow.nodes],
      edges: [...flow.edges],
    };
  });

  return snapshot;
}
