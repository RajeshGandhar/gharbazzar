import { NextRequest } from "next/server";
import { created, badRequest, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { createInquirySchema } from "@/features/leads/schemas";
import { createInquiry } from "@/features/leads/server/mutations";

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
