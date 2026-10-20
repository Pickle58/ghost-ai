import { authorizeLiveblocksRoom, roomIdFromAuthBody } from "@/lib/liveblocks";
import { readJsonBody } from "@/lib/project-body";
import { requireIdentity } from "@/lib/require-user";

export async function POST(request: Request) {
  const authResult = await requireIdentity();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const roomResult = roomIdFromAuthBody(bodyResult.body);
  if (!roomResult.ok) {
    return roomResult.response;
  }

  return authorizeLiveblocksRoom(authResult.identity, roomResult.roomId);
}
