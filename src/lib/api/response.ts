import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Typed JSON envelope — all API responses use this structure
// { data, error, meta }
// ---------------------------------------------------------------------------

export interface ApiMeta {
  page: number;
  perPage: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function paginated<T>(
  data: T[],
  meta: ApiMeta,
  status = 200
): NextResponse {
  return NextResponse.json({ data, meta }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return error({ code: "BAD_REQUEST", message, details }, 400);
}

export function unauthorized(message = "Authentication required"): NextResponse {
  return error({ code: "UNAUTHORIZED", message }, 401);
}

export function forbidden(message = "Insufficient permissions"): NextResponse {
  return error({ code: "FORBIDDEN", message }, 403);
}

export function notFound(message = "Resource not found"): NextResponse {
  return error({ code: "NOT_FOUND", message }, 404);
}

export function conflict(message: string): NextResponse {
  return error({ code: "CONFLICT", message }, 409);
}

export function tooManyRequests(message = "Rate limit exceeded"): NextResponse {
  return error({ code: "RATE_LIMITED", message }, 429);
}

export function serverError(message = "Internal server error"): NextResponse {
  return error({ code: "INTERNAL_ERROR", message }, 500);
}

function error(err: ApiError, status: number): NextResponse {
  return NextResponse.json({ error: err }, { status });
}
