import { jsonError } from "@/lib/http";
import { getAccessibleProject } from "@/lib/project-access";
import { requireIdentity } from "@/lib/require-user";
import { specDownloadFilename } from "@/lib/spec-paths";
import { db } from "@/src/prisma/db";

interface SpecListRouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(
  _request: Request,
  context: SpecListRouteContext,
) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { projectId } = await context.params;
  const project = await getAccessibleProject(projectId, authResult.identity);
  if (!project) {
    const existing = await db.orm.public.Project.where({ id: projectId }).first();
    return jsonError(
      existing ? "Forbidden" : "Not found",
      existing ? 403 : 404,
    );
  }

  try {
    const rows = await db.orm.public.ProjectSpec.where({ projectId: project.id })
      .orderBy([
        (spec) => spec.createdAt.desc(),
        (spec) => spec.id.desc(),
      ])
      .all();

    return Response.json({
      specs: rows.map((spec) => ({
        id: spec.id,
        createdAt: String(spec.createdAt),
        filename: specDownloadFilename(spec.id),
      })),
    });
  } catch (error) {
    console.error("Failed to list project specs", error);
    return jsonError("Could not load specs", 500);
  }
}
