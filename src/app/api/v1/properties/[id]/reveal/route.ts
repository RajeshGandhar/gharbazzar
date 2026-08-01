import { NextRequest } from "next/server";
import { ok, unauthorized, serverError, tooManyRequests } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { revealContact } from "@/features/properties/server/mutations";
import { checkRateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/v1/properties/:id/reveal
// Returns the seller's phone number and records the reveal event.
// DPDP consent is shown on the client before calling this endpoint.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  // Best-effort throttle: 20 reveals/hour per user (blocks scripted
  // contact-scraping across many listings; see src/lib/api/rate-limit.ts).
  if (!checkRateLimit(`reveal:${ctx.user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 })) {
    return tooManyRequests("Too many contact reveals. Please try again later.");
  }

  const { phone, error } = await revealContact(ctx.user.id, id);
  if (error) return serverError(error.message);

  // Return the number; client displays it and handles WhatsApp deep link
  return ok({ phone });
}
