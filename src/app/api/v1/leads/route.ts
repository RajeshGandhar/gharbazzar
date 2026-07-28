import { NextRequest } from "next/server";
import { paginated, unauthorized, serverError } from "@/lib/api/response";
import { parsePagination } from "@/lib/api/pagination";
import { requireSeller } from "@/lib/api/middleware";
import { listSellerLeads } from "@/features/leads/server/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/leads — seller's own lead inbox
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination(sp);
  const status = sp.get("status") ?? undefined;

  const { data, count, error } = await listSellerLeads(ctx.user.id, pagination, status);
  if (error) return serverError(error.message);

  return paginated(data ?? [], {
    page: pagination.page,
    perPage: pagination.perPage,
    total: count,
  });
}
