import { NextRequest } from "next/server";
import { paginated, notFound, serverError } from "@/lib/api/response";
import { parsePagination } from "@/lib/api/pagination";
import { createClient } from "@/lib/supabase/server";
import { listSellerProperties } from "@/features/properties/server/queries";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/sellers/:id/listings — public: active listings by a seller slug
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination(sp);

  // Resolve slug → uuid if needed
  const supabase = await createClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (!seller) return notFound();

  const { data, count, error } = await listSellerProperties(
    seller.id,
    pagination,
    "active" // public view: only active listings
  );
  if (error) return serverError(error.message);

  return paginated(data ?? [], {
    page: pagination.page,
    perPage: pagination.perPage,
    total: count,
  });
}
