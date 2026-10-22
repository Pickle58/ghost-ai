export interface DesignAgentTaskInput {
  runId: string;
  projectId: string;
  roomId: string;
  prompt: string;
  userId: string;
}

export interface DesignAgentTaskResult {
  runId: string;
  projectId: string;
  roomId: string;
  userId: string;
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  message: string;
}

export async function designAgentTask(
  input: DesignAgentTaskInput,
): Promise<DesignAgentTaskResult> {
  const prompt = input.prompt.trim();

  if (!prompt) {
    throw new Error("Prompt is required");
  }

  return {
    runId: input.runId,
    projectId: input.projectId,
    roomId: input.roomId,
    userId: input.userId,
    prompt,
    status: "queued",
    message: "Design task accepted and queued for background processing.",
  };
}

export const designAgent = designAgentTask;

export function createDesignRunToken(input: {
  runId: string;
  projectId: string;
  userId: string;
}): string {
  const payload = {
    runId: input.runId,
    projectId: input.projectId,
    userId: input.userId,
    kind: "design-run-token",
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export default designAgentTask;
