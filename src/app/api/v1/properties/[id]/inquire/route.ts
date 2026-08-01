import { NextRequest } from "next/server";
import { created, badRequest, serverError, tooManyRequests } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { createInquirySchema } from "@/features/leads/schemas";
import { createInquiry } from "@/features/leads/server/mutations";
import { checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/v1/properties/:id/inquire
// Authenticated customers preferred; anonymous allowed (no auth required so
// seekers on first visit can still reach sellers).
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await getAuthContext(req);

  // Best-effort throttle: 5 inquiries/10min per IP (anonymous endpoint —
  // blocks scripted lead spam; see src/lib/api/rate-limit.ts).
  const rateLimitKey = ctx ? `inquire:user:${ctx.user.id}` : `inquire:ip:${getClientIp(req)}`;
  if (!checkRateLimit(rateLimitKey, { limit: 5, windowMs: 10 * 60 * 1000 })) {
    return tooManyRequests("Too many inquiries. Please try again later.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = createInquirySchema.safeParse({ ...(body as object), property_id: id });
  if (!parsed.success) return badRequest("Validation failed", parsed.error.flatten());

  const { data, error } = await createInquiry(parsed.data, ctx?.user.id);
  if (error) return serverError(error.message);
  return created(data);
}
