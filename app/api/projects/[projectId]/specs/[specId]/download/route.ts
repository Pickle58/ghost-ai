import { jsonError } from "@/lib/http";
import { getAccessibleProject } from "@/lib/project-access";
import { requireIdentity } from "@/lib/require-user";
import {
  getProjectSpec,
  readSpecFile,
  specDownloadFilename,
} from "@/lib/spec-storage";
import { db } from "@/src/prisma/db";

interface SpecDownloadRouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(
  _request: Request,
  context: SpecDownloadRouteContext,
) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId, specId } = await context.params;
  const project = await getAccessibleProject(projectId, authResult.identity);
  if (!project) {
    const existing = await db.orm.public.Project.where({ id: projectId }).first();
    return jsonError(
      existing ? "Forbidden" : "Not found",
      existing ? 403 : 404,
    );
  }

  const spec = await getProjectSpec(project.id, specId);
  if (!spec) {
    return jsonError("Not found", 404);
  }

  const stream = await readSpecFile(spec.filePath);
  if (!stream) {
    return jsonError("Not found", 404);
  }

  return new Response(stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${specDownloadFilename(spec.id)}"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
