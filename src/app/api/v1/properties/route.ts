import { NextRequest } from "next/server";
import {
  ok,
  paginated,
  created,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from "@/lib/api/response";
import { parsePagination } from "@/lib/api/pagination";
import { getAuthContext, requireSeller } from "@/lib/api/middleware";
import { createPropertySchema } from "@/features/properties/schemas";
import {
  listProperties,
} from "@/features/properties/server/queries";
import { createProperty } from "@/features/properties/server/mutations";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/v1/properties — public browsable listing feed
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const pagination = parsePagination(sp);

  const sort = sp.get("sort") as "price_asc" | "price_desc" | "newest" | "popular" | null;

  const { data, count, error } = await listProperties({
    purpose:        (sp.get("purpose") as never) ?? undefined,
    cityId:         sp.get("city_id") ? Number(sp.get("city_id")) : undefined,
    areaId:         sp.get("area_id") ? Number(sp.get("area_id")) : undefined,
    rentalKind:     (sp.get("rental_kind") as never) ?? undefined,
    minPrice:       sp.get("min_price") ? Number(sp.get("min_price")) : undefined,
    maxPrice:       sp.get("max_price") ? Number(sp.get("max_price")) : undefined,
    bedrooms:       sp.get("bedrooms") !== null ? Number(sp.get("bedrooms")) : undefined,
    propertyTypeId: sp.get("property_type_id") ? Number(sp.get("property_type_id")) : undefined,
    sort:           sort ?? "newest",
    pagination,
  });

  if (error) return serverError(error.message);

  return paginated(data ?? [], {
    page: pagination.page,
    perPage: pagination.perPage,
    total: count,
  });
}

// ---------------------------------------------------------------------------
// POST /api/v1/properties — create listing (seller only)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  // Resolve city name for slug generation
  const { data: city } = await ctx.supabase
    .from("cities")
    .select("name")
    .eq("id", parsed.data.city_id)
    .single();

  if (!city) return badRequest("Invalid city_id");

  const { data, error } = await createProperty(
    ctx.user.id,
    parsed.data,
    city.name
  );

  if (error) return serverError(error.message);
  return created(data);
}
