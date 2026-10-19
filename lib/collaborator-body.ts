import { normalizeEmail } from "@/lib/email";
import { jsonError } from "@/lib/http";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 320;

export function collaboratorEmail(
  body: Record<string, unknown> | null,
): { ok: true; email: string } | { ok: false; response: Response } {
  if (body === null || !Object.hasOwn(body, "email")) {
    return { ok: false, response: jsonError("Email is required", 400) };
  }

  if (typeof body.email !== "string") {
    return { ok: false, response: jsonError("Invalid email", 400) };
  }

  const email = normalizeEmail(body.email);
  if (email === "") {
    return { ok: false, response: jsonError("Email is required", 400) };
  }

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return { ok: false, response: jsonError("Invalid email", 400) };
  }

  return { ok: true, email };
}
