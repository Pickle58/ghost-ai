export interface ProjectSummary {
  id: string;
  name: string;
}

export function toProjectSummary(project: {
  id: string;
  name: string;
}): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
  };
}
