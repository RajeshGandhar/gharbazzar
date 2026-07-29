import { NextRequest } from "next/server";
import { paginated, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { parsePagination, toRange } from "@/lib/api/pagination";

export const runtime = "nodejs";

// GET /api/v1/me/notifications
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams);
  const { from, to } = toRange(pagination);
  const { page, perPage } = pagination;

  const { data, count, error } = await ctx.supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return serverError(error.message);
  return paginated(data ?? [], { page, perPage, total: count ?? 0 });
}
