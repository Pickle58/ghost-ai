import { del, get, put } from "@vercel/blob";

import { specBlobPath } from "@/lib/spec-paths";
import { db } from "@/src/prisma/db";

export { specBlobPath, specDownloadFilename } from "@/lib/spec-paths";

export interface SavedProjectSpec {
  specId: string;
  filePath: string;
}

export async function saveGeneratedSpec(
  projectId: string,
  markdown: string,
): Promise<SavedProjectSpec> {
  const project = await db.orm.public.Project.where({ id: projectId }).first();
  if (!project) {
    throw new Error("Project not found");
  }

  const specId = crypto.randomUUID();
  const blob = await put(specBlobPath(projectId, specId), markdown, {
    access: "private",
    contentType: "text/markdown; charset=utf-8",
  });

  try {
    await db.orm.public.ProjectSpec.create({
      id: specId,
      projectId,
      filePath: blob.url,
    });
  } catch (error) {
    await del(blob.url);
    throw error;
  }

  return {
    specId,
    filePath: blob.url,
  };
}

export async function readSpecFile(
  filePath: string,
): Promise<ReadableStream<Uint8Array> | null> {
  const result = await get(filePath, {
    access: "private",
    useCache: false,
  });

  if (!result || !result.stream) {
    return null;
  }

  return result.stream;
}

export async function getProjectSpec(projectId: string, specId: string) {
  return db.orm.public.ProjectSpec.where({
    id: specId,
    projectId,
  }).first();
}

export { listProjectSpecs } from "@/lib/spec-list";
