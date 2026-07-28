import { NextRequest } from "next/server";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  noContent,
  serverError,
} from "@/lib/api/response";
import { getAuthContext, requireSeller, requireAdmin } from "@/lib/api/middleware";
import { updatePropertySchema } from "@/features/properties/schemas";
import { getPropertyById } from "@/features/properties/server/queries";
import {
  updateProperty,
  deleteProperty,
  setApprovalStatus,
} from "@/features/properties/server/mutations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/properties/:id — single property (seller/admin auth not required
// for public, but needed to view own drafts)
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { data, error } = await getPropertyById(id);
  if (error || !data) return notFound();
  return ok(data);
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/properties/:id — update (owner seller or admin)
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  // Admin approval patch (approval_status field present)
  const raw = body as Record<string, unknown>;
  if ("approval_status" in raw) {
    const adminCtx = await requireAdmin(req);
    if (!adminCtx) return forbidden();

    const { data, error } = await setApprovalStatus(
      id,
      raw.approval_status as "approved" | "rejected",
      adminCtx.user.id,
      raw.rejection_reason as string | undefined
    );
    if (error || !data) return serverError(error?.message ?? "Failed");
    return ok(data);
  }

  // Seller update
  const parsed = updatePropertySchema.safeParse(body);
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await updateProperty(id, ctx.user.id, parsed.data);
  if (error) {
    if (error.code === "PGRST116") return notFound(); // no rows matched
    return serverError(error.message);
  }
  return ok(data);
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/properties/:id — soft-delete (owner or admin)
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { error } = await deleteProperty(id, ctx.user.id);
  if (error) {
    if (error.code === "PGRST116") return notFound();
    return serverError(error.message);
  }
  return noContent();
}
