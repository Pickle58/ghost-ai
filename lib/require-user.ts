import { auth } from "@clerk/nextjs/server";
import { jsonError } from "@/lib/http";

export async function requireUserId(): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }

  return { ok: true, userId };
}
