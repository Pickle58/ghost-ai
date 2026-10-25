import { z } from "zod";

import type { ClerkIdentity } from "@/lib/project-access";

export const designRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
});

export interface DesignRequestParsed {
  ok: true;
  prompt: string;
  roomId: string;
}

export interface DesignTaskTargets {
  projectId: string;
  roomId: string;
}

export interface DesignRunResolved extends DesignTaskTargets {
  prompt: string;
  accessRoomId: string;
}

export type DesignRequestParseResult =
  | DesignRequestParsed
  | DesignRequestInvalid;

export interface DesignRunResolvedSuccess extends DesignRunResolved {
  ok: true;
}

export interface DesignRequestInvalid {
  ok: false;
  status: 400;
  error: string;
}

export interface DesignRequestInaccessible {
  ok: false;
  status: "inaccessible";
  accessRoomId: string;
}

export type DesignRunResolveResult =
  | DesignRunResolvedSuccess
  | DesignRequestInvalid
  | DesignRequestInaccessible;

const REQUIRED_FIELDS_ERROR = "Prompt and roomId are required";

export function parseDesignRequest(body: unknown): DesignRequestParseResult {
  const parsed = designRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: REQUIRED_FIELDS_ERROR,
    };
  }

  return {
    ok: true,
    prompt: parsed.data.prompt,
    roomId: parsed.data.roomId,
  };
}

export function resolveDesignTaskTargets(project: { id: string }): DesignTaskTargets {
  return {
    projectId: project.id,
    roomId: project.id,
  };
}

export async function resolveDesignRunRequest(
  body: unknown,
  identity: ClerkIdentity,
  lookupProject: (
    roomId: string,
    identity: ClerkIdentity,
  ) => Promise<{ id: string } | null>,
): Promise<DesignRunResolveResult> {
  const parsed = parseDesignRequest(body);
  if (!parsed.ok) {
    return parsed;
  }

  const project = await lookupProject(parsed.roomId, identity);
  if (!project) {
    return {
      ok: false,
      status: "inaccessible",
      accessRoomId: parsed.roomId,
    };
  }

  return {
    ok: true,
    prompt: parsed.prompt,
    accessRoomId: parsed.roomId,
    ...resolveDesignTaskTargets(project),
  };
}
