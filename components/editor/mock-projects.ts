export type ProjectOwnership = "owned" | "shared";

export interface ProjectSummary {
  id: string;
  name: string;
  ownership: ProjectOwnership;
}

export const mockProjects: readonly ProjectSummary[] = [
  {
    id: "project-checkout",
    name: "Checkout Service",
    ownership: "owned",
  },
  {
    id: "project-events",
    name: "Event Pipeline",
    ownership: "owned",
  },
  {
    id: "project-platform",
    name: "Platform Overview",
    ownership: "shared",
  },
];
