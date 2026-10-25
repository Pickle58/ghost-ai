import { createGoogle } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { AbortTaskRunError, logger, metadata, schemaTask, wait } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { readCanvasSnapshot } from "@/lib/liveblocks-flow";
import { toSpecEdges, toSpecNodes } from "@/lib/spec-payload";
import { saveGeneratedSpec } from "@/lib/spec-storage";
import { generateSpecTaskSchema } from "@/types/spec-generation";

import { generateWithCapacityRetry, isDailyQuotaError } from "./ai-capacity";
import { buildSpecPrompt, missingRequiredSpecHeadings } from "./spec-prompt";

export { REQUIRED_SPEC_HEADINGS, missingRequiredSpecHeadings } from "./spec-prompt";

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

export function assertSpecHasRequiredHeadings(spec: string): void {
  const missing = missingRequiredSpecHeadings(spec);
  if (missing.length > 0) {
    throw new AbortTaskRunError(
      `Gemini returned a spec missing required sections: ${missing.join(", ")}`,
    );
  }
}

function getGoogleClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return createGoogle({ apiKey });
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

    const google = getGoogleClient();
    if (!google) {
      metadata.set("status", "error");
      throw new AbortTaskRunError("GOOGLE_AI_API_KEY is not set");
    }

    const prompt = buildSpecPrompt({
      ...input,
      nodes,
      edges,
    });

    try {
      const generated = await generateWithCapacityRetry({
        generate: async (modelId) => {
          const result = await generateText({
            model: google(modelId),
            prompt,
            maxRetries: 1,
          });
          return result.text.trim();
        },
        wait: async (seconds) => {
          await wait.for({ seconds });
        },
        onRetry: ({ modelId, attempt, waitSeconds, fallback }) => {
          logger.warn(
            fallback
              ? "Gemini overloaded, switching to fallback model"
              : "Gemini overloaded, waiting before retry",
            { modelId, attempt, waitSeconds, fallback },
          );
        },
      });

      logger.info("Gemini spec model selected", {
        projectId: input.projectId,
        modelId: generated.modelId,
      });

      const spec = generated.value;
      if (!spec) {
        metadata.set("status", "error");
        throw new AbortTaskRunError("Gemini returned an empty spec");
      }

      assertSpecHasRequiredHeadings(spec);

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
      if (isDailyQuotaError(error)) {
        throw new AbortTaskRunError(
          "Gemini daily quota exceeded. Wait for the quota to reset or use a paid Google AI key.",
        );
      }
      throw error;
    }
  },
});
