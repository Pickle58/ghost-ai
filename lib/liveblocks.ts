import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks, LiveblocksError } from "@liveblocks/node";

import { cursorColorForUser } from "@/lib/cursor-color";
import { jsonError } from "@/lib/http";
import { getAccessibleProject, type ClerkIdentity } from "@/lib/project-access";
import { isRoomId } from "@/lib/project-slug";
import type { LiveblocksUserInfo } from "@/liveblocks.config";

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks;
};

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export function roomIdFromAuthBody(
  body: Record<string, unknown> | null,
): { ok: true; roomId: string } | { ok: false; response: Response } {
  const roomId = body?.room;
  if (typeof roomId !== "string" || !isRoomId(roomId)) {
    return { ok: false, response: jsonError("Invalid room", 400) };
  }

  return { ok: true, roomId };
}

export function getLiveblocks(): Liveblocks {
  const existing = globalForLiveblocks.liveblocks;
  if (existing) {
    return existing;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  const liveblocks = new Liveblocks({ secret });
  globalForLiveblocks.liveblocks = liveblocks;
  return liveblocks;
}

export async function authorizeLiveblocksRoom(
  identity: ClerkIdentity,
  roomId: string,
): Promise<Response> {
  const project = await getAccessibleProject(roomId, identity);
  if (!project) {
    return jsonError("Forbidden", 403);
  }

  try {
    const liveblocks = getLiveblocks();
    await liveblocks.getOrCreateRoom(project.id, { defaultAccesses: [] });

    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: await liveblocksUserInfo(identity.userId),
    });
    session.allow(project.id, ["*:write"]);

    const { status, body } = await session.authorize();
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof LiveblocksError) {
      return jsonError("Could not open the room", 502);
    }

    throw error;
  }
}

async function liveblocksUserInfo(userId: string): Promise<LiveblocksUserInfo> {
  const user = await currentUser();

  return {
    name: displayName(user),
    avatar: avatarUrl(user),
    color: cursorColorForUser(userId),
  };
}

function displayName(user: ClerkUser | null): string {
  const fullName = [user?.firstName, user?.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(" ")
    .trim();
  if (fullName !== "") {
    return fullName;
  }

  const username = user?.username?.trim() ?? "";
  if (username !== "") {
    return username;
  }

  return "Anonymous";
}

function avatarUrl(user: ClerkUser | null): string {
  const value = user?.imageUrl ?? "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
