import { db } from "@/src/prisma/db";

export async function listProjectSpecs(projectId: string) {
  return db.orm.public.ProjectSpec.where({ projectId })
    .orderBy([
      (spec) => spec.createdAt.desc(),
      (spec) => spec.id.desc(),
    ])
    .all();
}
