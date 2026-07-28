import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/api/response";
import { requireSeller } from "@/lib/api/middleware";
import { updateInquiryStatusSchema } from "@/features/leads/schemas";
import { getInquiryById } from "@/features/leads/server/queries";
import { updateInquiryStatus } from "@/features/leads/server/mutations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/leads/:id
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { data, error } = await getInquiryById(id, ctx.user.id);
  if (error || !data) return notFound();
  return ok(data);
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/leads/:id — update status / notes
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try { body = await req.json(); }
  catch { return badRequest("Invalid JSON"); }

  const parsed = updateInquiryStatusSchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await updateInquiryStatus(
    id,
    ctx.user.id,
    parsed.data.status,
    parsed.data.notes
  );
  if (error) {
    if (error.code === "PGRST116") return notFound();
    return serverError(error.message);
  }
  return ok(data);
}
