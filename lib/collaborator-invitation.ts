import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { clerkClient } from "@clerk/nextjs/server";

export async function sendCollaboratorInvitation(
  email: string,
): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      notify: true,
      ignoreExisting: true,
    });
    return true;
  } catch (error) {
    console.error(
      "Collaborator invitation email failed",
      clerkErrorCodes(error),
    );
    return false;
  }
}

function clerkErrorCodes(error: unknown): string[] {
  if (!isClerkAPIResponseError(error)) {
    return [];
  }

  return error.errors.map((item) => item.code);
}
