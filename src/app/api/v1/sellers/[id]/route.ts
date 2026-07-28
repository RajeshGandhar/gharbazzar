import { NextRequest } from "next/server";
import { ok, notFound, serverError } from "@/lib/api/response";
import { getSellerBySlug } from "@/features/sellers/server/queries";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/sellers/:id — public seller profile by slug or UUID
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await getSellerBySlug(id);
  if (error || !data) return notFound();
  return ok(data);
}
