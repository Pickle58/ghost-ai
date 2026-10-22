import { get, put } from "@vercel/blob";

import { db } from "@/src/prisma/db";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface CanvasSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return Array.isArray(record.nodes) && Array.isArray(record.edges);
}

export async function readCanvasSnapshot(
  projectId: string,
): Promise<CanvasSnapshot | null> {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project || !project.canvasJsonPath) {
    return null;
  }

  const result = await get(project.canvasJsonPath, {
    access: "private",
    useCache: false,
  });

  if (!result || !result.stream) {
    return null;
  }

  const payload: unknown = await new Response(result.stream).json();
  return isCanvasSnapshot(payload) ? payload : null;
}

export async function saveCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot,
): Promise<string> {
  const existing = await db.orm.public.Project.where({ id: projectId }).first();
  if (!existing) {
    throw new Error("Project not found");
  }

  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(snapshot, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });

  await db.orm.public.Project.where({ id: projectId }).update({
    canvasJsonPath: blob.url,
  });

  return blob.url;
}
