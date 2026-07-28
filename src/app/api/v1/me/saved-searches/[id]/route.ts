import { NextRequest } from "next/server";
import { ok, noContent, unauthorized, badRequest, notFound, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { savedSearchSchema } from "@/features/sellers/schemas";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON"); }

  const parsed = savedSearchSchema.partial().safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await ctx.supabase
    .from("saved_searches")
    .update({ ...parsed.data, filters: parsed.data.filters as import("@/types/database.types").Json | undefined })
    .eq("id", id)
    .eq("user_id", ctx.user.id)     // RLS double-lock
    .select("id, name, frequency, email_alerts")
    .single();

  if (error) {
    if (error.code === "PGRST116") return notFound();
    return serverError(error.message);
  }
  return ok(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { error } = await ctx.supabase
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.user.id);

  if (error) return serverError(error.message);
  return noContent();
}
