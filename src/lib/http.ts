import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { HttpError } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { message, details } },
    { status }
  );
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Body must be valid JSON.");
  }
  try {
    return schema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new HttpError(422, "Validation failed: " + e.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    throw e;
  }
}

export async function withErrors(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message);
    // Next.js throws this internally when probing dynamic routes during build;
    // re-throw so the framework can handle it instead of returning HTTP 500.
    if (e instanceof Error && (e as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw e;
    }
    console.error("Unhandled API error", e);
    const msg = e instanceof Error ? e.message : "Internal server error";
    return fail(500, msg);
  }
}
