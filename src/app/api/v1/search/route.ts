import { NextRequest } from "next/server";
import { paginated, badRequest, serverError } from "@/lib/api/response";
import { getAuthContext } from "@/lib/api/middleware";
import { searchSchema } from "@/features/search/schemas";
import { searchProperties, recordSearchEvent } from "@/features/search/server/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/search — full listing search with FTS + filters
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw: Record<string, string | undefined> = {};
  sp.forEach((value, key) => { raw[key] = value; });

  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) return badRequest("Invalid search parameters", parsed.error.flatten());

  const input = parsed.data;
  const { data, count, error } = await searchProperties(input);
  if (error) return serverError(error.message);

  // Fire-and-forget analytics (don't await; don't block the response)
  const ctx = await getAuthContext(req);
  void recordSearchEvent({
    userId: ctx?.user.id,
    sessionId: req.headers.get("x-session-id") ?? undefined,
    purpose: input.purpose,
    filters: raw,
    resultCount: count,
  });

  return paginated(data ?? [], {
    page: input.page,
    perPage: input.per_page,
    total: count,
  });
}
