import { createGoogle } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { AbortTaskRunError, logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { readCanvasSnapshot } from "@/lib/liveblocks-flow";
import { toSpecEdges, toSpecNodes } from "@/lib/spec-payload";
import { saveGeneratedSpec } from "@/lib/spec-storage";
import { generateSpecTaskSchema } from "@/types/spec-generation";

import { buildSpecPrompt } from "./spec-prompt";

export {
  generateSpecRequestSchema,
  generateSpecTaskSchema,
} from "@/types/spec-generation";

export type { GenerateSpecTaskInput } from "@/types/spec-generation";

export { buildSpecPrompt } from "./spec-prompt";

export const MAX_SPEC_SNAPSHOT_NODES = 200;
export const MAX_SPEC_SNAPSHOT_EDGES = 400;

export function assertSpecSnapshotSize(
  nodeCount: number,
  edgeCount: number,
): void {
  if (
    nodeCount > MAX_SPEC_SNAPSHOT_NODES ||
    edgeCount > MAX_SPEC_SNAPSHOT_EDGES
  ) {
    throw new AbortTaskRunError(
      `Canvas snapshot is too large to generate a spec (${nodeCount} nodes, ${edgeCount} edges). Maximum is ${MAX_SPEC_SNAPSHOT_NODES} nodes and ${MAX_SPEC_SNAPSHOT_EDGES} edges.`,
    );
  }
}

function getGoogleModel() {
  const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const google = createGoogle({ apiKey });
  return google("gemini-3.8-flash");
}

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new AbortTaskRunError("LIVEBLOCKS_SECRET_KEY is not set");
  }

  return new Liveblocks({ secret });
}

export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecTaskSchema,
  retry: {
    maxAttempts: 1,
  },
  run: async (input) => {
    metadata
      .set("status", "processing")
      .set("projectId", input.projectId)
      .set("roomId", input.roomId);

    const snapshot = await readCanvasSnapshot(createLiveblocksClient(), input.roomId);

    logger.info("Read Liveblocks canvas snapshot", {
      roomId: input.roomId,
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
    });

    try {
      assertSpecSnapshotSize(snapshot.nodes.length, snapshot.edges.length);
    } catch (error) {
      metadata.set("status", "error");
      throw error;
    }

    const nodes = toSpecNodes(snapshot.nodes);
    const edges = toSpecEdges(snapshot.edges);

    logger.info("Generating technical spec", {
      projectId: input.projectId,
      roomId: input.roomId,
      nodeCount: snapshot.nodes.length,
      edgeCount: snapshot.edges.length,
      chatCount: input.chatHistory.length,
    });

    const model = getGoogleModel();
    if (!model) {
      metadata.set("status", "error");
      throw new AbortTaskRunError("GOOGLE_AI_API_KEY is not set");
    }

    try {
      const result = await generateText({
        model,
        prompt: buildSpecPrompt({
          ...input,
          nodes,
          edges,
        }),
      });

      const spec = result.text.trim();
      if (!spec) {
        metadata.set("status", "error");
        throw new AbortTaskRunError("Gemini returned an empty spec");
      }

      const saved = await saveGeneratedSpec(input.projectId, spec);

      metadata.set("status", "complete").set("specId", saved.specId);
      logger.info("Technical spec generated", {
        projectId: input.projectId,
        specId: saved.specId,
        specLength: spec.length,
      });

      return spec;
    } catch (error) {
      metadata.set("status", "error");
      logger.error("Spec generation failed", {
        projectId: input.projectId,
        message: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  },
});
