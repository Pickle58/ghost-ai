import { createHmac, timingSafeEqual } from "node:crypto";

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

export interface DesignRunTokenClaims {
  runId: string;
  projectId: string;
  userId: string;
  kind: "design-run-token";
  exp: number;
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

function getDesignRunTokenSecret(): string {
  const secret = process.env.DESIGN_RUN_TOKEN_SECRET;
  if (!secret) {
    throw new Error("DESIGN_RUN_TOKEN_SECRET is not set");
  }

  return secret;
}

export function createDesignRunToken(input: {
  runId: string;
  projectId: string;
  userId: string;
}): string {
  const secret = getDesignRunTokenSecret();
  const payload: DesignRunTokenClaims = {
    runId: input.runId,
    projectId: input.projectId,
    userId: input.userId,
    kind: "design-run-token",
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifyDesignRunToken(token: string): DesignRunTokenClaims | null {
  const secret = process.env.DESIGN_RUN_TOKEN_SECRET;
  if (!secret || !token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(body)
    .digest();
  const providedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== providedSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<DesignRunTokenClaims>;
    if (
      !payload ||
      payload.kind !== "design-run-token" ||
      typeof payload.runId !== "string" ||
      typeof payload.projectId !== "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.exp !== "number" ||
      Number.isNaN(payload.exp)
    ) {
      return null;
    }

    if (Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }

    return {
      runId: payload.runId,
      projectId: payload.projectId,
      userId: payload.userId,
      kind: "design-run-token",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export default designAgentTask;
