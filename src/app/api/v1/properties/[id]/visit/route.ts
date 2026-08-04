import { NextRequest } from "next/server";
import { created, badRequest, unauthorized, serverError, tooManyRequests } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { createVisitSchema } from "@/features/leads/schemas";
import { createVisit } from "@/features/leads/server/mutations";
import { checkRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/v1/properties/:id/visit
// Authenticated only — visit_appointments RLS requires customer_id = auth.uid().
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized("Sign in to schedule a visit");

  if (!checkRateLimit(`visit:user:${ctx.user.id}`, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return tooManyRequests("Too many visit requests. Please try again later.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = createVisitSchema.safeParse({ ...(body as object), property_id: id });
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await createVisit(parsed.data, ctx.user.id);
  if (error) return serverError(error.message);
  return created(data);
}
