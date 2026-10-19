import { auth } from "@clerk/nextjs/server";

import { jsonError } from "@/lib/http";
import { getClerkIdentity, type ClerkIdentity } from "@/lib/project-access";

export async function requireUserId(): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }

  return { ok: true, userId };
}

export async function requireIdentity(): Promise<
  { ok: true; identity: ClerkIdentity } | { ok: false; response: Response }
> {
  const identity = await getClerkIdentity();
  if (!identity) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }

  return { ok: true, identity };
}
