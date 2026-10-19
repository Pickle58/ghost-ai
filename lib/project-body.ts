import { jsonError } from "@/lib/http";
import { isRoomId } from "@/lib/project-slug";

export const UNTITLED_PROJECT_NAME = "Untitled Project";

type JsonBodyResult =
  | { ok: true; body: Record<string, unknown> | null }
  | { ok: false; response: Response };

type NameResult = { ok: true; name: string } | { ok: false; response: Response };

type EmptyName = "default" | "reject";

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const text = await request.text();

  if (text.trim() === "") {
    return { ok: true, body: null };
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, response: jsonError("Invalid request", 400) };
  }

  if (!isJsonObject(value)) {
    return { ok: false, response: jsonError("Invalid request", 400) };
  }

  return { ok: true, body: value };
}

export function projectIdForCreate(
  body: Record<string, unknown> | null,
): { ok: true; id: string | null } | { ok: false; response: Response } {
  if (body === null || !Object.hasOwn(body, "id") || body.id == null) {
    return { ok: true, id: null };
  }

  if (typeof body.id !== "string" || !isRoomId(body.id)) {
    return { ok: false, response: jsonError("Invalid project id", 400) };
  }

  return { ok: true, id: body.id };
}

export function projectNameForCreate(
  body: Record<string, unknown> | null,
): NameResult {
  if (body === null || !Object.hasOwn(body, "name") || body.name === null) {
    return { ok: true, name: UNTITLED_PROJECT_NAME };
  }

  return trimmedName(body.name, "default");
}

export function projectNameForRename(
  body: Record<string, unknown> | null,
): NameResult {
  if (body === null || !Object.hasOwn(body, "name")) {
    return { ok: false, response: jsonError("Project name is required", 400) };
  }

  return trimmedName(body.name, "reject");
}

function trimmedName(value: unknown, empty: EmptyName): NameResult {
  if (typeof value !== "string") {
    return { ok: false, response: jsonError("Invalid project name", 400) };
  }

  const name = value.trim();
  if (name !== "") {
    return { ok: true, name };
  }

  switch (empty) {
    case "default":
      return { ok: true, name: UNTITLED_PROJECT_NAME };
    case "reject":
      return { ok: false, response: jsonError("Project name is required", 400) };
    default: {
      const unreachable: never = empty;
      return unreachable;
    }
  }
}
