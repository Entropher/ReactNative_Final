import { GiftAIError } from "./gift-ai.ts";

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

/** Error body the app reads: { error: string, code?: string }. */
export function errorJson(message: string, status: number, code?: string): Response {
  return json({ error: message, code }, status);
}

export function handleUnexpected(error: unknown): Response {
  if (error instanceof GiftAIError) {
    return errorJson(error.message, error.status);
  }
  console.error("Unexpected error:", error);
  return errorJson("Something went wrong. Please try again.", 500);
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
