export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}
