import { NextRequest } from "next/server";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { revealContact } from "@/features/properties/server/mutations";

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

  const { phone, error } = await revealContact(ctx.user.id, id);
  if (error) return serverError(error.message);

  // Return the number; client displays it and handles WhatsApp deep link
  return ok({ phone });
}
