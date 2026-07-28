import { NextRequest } from "next/server";
import { ok, created, noContent, unauthorized, badRequest, notFound, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { savedSearchSchema } from "@/features/sellers/schemas";
import { listSavedSearches } from "@/features/sellers/server/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/me/saved-searches — list own saved searches (alert subscriptions)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { data, error } = await listSavedSearches(ctx.user.id);
  if (error) return serverError(error.message);
  return ok(data ?? []);
}

// ---------------------------------------------------------------------------
// POST /api/v1/me/saved-searches — create a new saved search
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON"); }

  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await ctx.supabase
    .from("saved_searches")
    .insert({ user_id: ctx.user.id, ...parsed.data, filters: parsed.data.filters as import("@/types/database.types").Json })
    .select("id, name, filters, frequency, email_alerts, created_at")
    .single();

  if (error) return serverError(error.message);
  return created(data);
}
