"use client";

import { useEffect, useState } from "react";

export interface ShareCollaborator {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export function useShareCollaborators(projectId: string, open: boolean) {
  const [collaborators, setCollaborators] = useState<ShareCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setIsLoading(true);
      setError(null);
      setCollaborators([]);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(collaboratorsPath(projectId), { signal });
        if (signal.aborted) {
          return;
        }

        if (!response.ok) {
          setCollaborators([]);
          setError(await readErrorMessage(response));
          return;
        }

        const nextCollaborators = await readCollaborators(response);
        if (signal.aborted) {
          return;
        }

        if (!nextCollaborators) {
          setCollaborators([]);
          setError("Something went wrong. Try again.");
          return;
        }

        setCollaborators(nextCollaborators);
      } catch (caught) {
        if (signal.aborted || isAbortError(caught)) {
          return;
        }

        setError("Something went wrong. Try again.");
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [open, projectId]);

  async function invite(email: string): Promise<"sent" | "unsent" | "error"> {
    const nextEmail = email.trim();
    if (isInviting || removingId !== null || nextEmail === "") {
      return "error";
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await fetch(collaboratorsPath(projectId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return "error";
      }

      const invited = await readInvite(response);
      if (!invited) {
        setError("Something went wrong. Try again.");
        return "error";
      }

      setCollaborators((current) =>
        current.some((item) => item.id === invited.collaborator.id)
          ? current
          : [...current, invited.collaborator],
      );

      if (!invited.emailSent) {
        setError("The invitation email could not be sent. Try again.");
        return "unsent";
      }

      return "sent";
    } catch {
      setError("Something went wrong. Try again.");
      return "error";
    } finally {
      setIsInviting(false);
    }
  }

  async function remove(collaboratorId: string) {
    if (isInviting || removingId !== null) {
      return;
    }

    setRemovingId(collaboratorId);
    setError(null);

    try {
      const response = await fetch(
        `${collaboratorsPath(projectId)}/${encodeURIComponent(collaboratorId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.id !== collaboratorId),
      );
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  return {
    collaborators,
    isLoading,
    isInviting,
    removingId,
    error,
    invite,
    remove,
  };
}

function collaboratorsPath(projectId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/collaborators`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function readCollaborators(
  response: Response,
): Promise<ShareCollaborator[] | null> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body) || !Array.isArray(body.collaborators)) {
      return null;
    }

    const collaborators: ShareCollaborator[] = [];
    for (const item of body.collaborators) {
      const collaborator = parseCollaborator(item);
      if (!collaborator) {
        return null;
      }

      collaborators.push(collaborator);
    }

    return collaborators;
  } catch {
    return null;
  }
}

async function readInvite(
  response: Response,
): Promise<{ collaborator: ShareCollaborator; emailSent: boolean } | null> {
  try {
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.emailSent !== "boolean") {
      return null;
    }

    const collaborator = parseCollaborator(body.collaborator);
    if (!collaborator) {
      return null;
    }

    return { collaborator, emailSent: body.emailSent };
  } catch {
    return null;
  }
}

function parseCollaborator(value: unknown): ShareCollaborator | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.trim() === "") {
    return null;
  }

  if (typeof value.email !== "string" || value.email.trim() === "") {
    return null;
  }

  if (value.name !== null && typeof value.name !== "string") {
    return null;
  }

  if (value.imageUrl !== null && typeof value.imageUrl !== "string") {
    return null;
  }

  return {
    id: value.id,
    email: value.email,
    name: value.name,
    imageUrl: value.imageUrl,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      isRecord(body) &&
      typeof body.error === "string" &&
      body.error.trim() !== ""
    ) {
      return body.error;
    }
  } catch {
    return "Something went wrong. Try again.";
  }

  return "Something went wrong. Try again.";
}
