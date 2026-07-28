import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  badRequest,
  conflict,
  created,
  serverError,
  unauthorized,
} from "@/lib/api/response";

export const runtime = "nodejs";

const onboardSchema = z.object({
  seller_type: z.enum(["owner", "agent", "builder", "property_manager"]),
  business_name: z.string().min(2).max(120).optional(),
  whatsapp_number: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  city_id: z.number().int().positive().optional(),
  about: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  rera_number: z.string().max(50).optional(),
});

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = onboardSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { seller_type, business_name, whatsapp_number, city_id, about, website, rera_number } =
    parsed.data;

  const adminSupabase = createAdminClient();

  // Check if sellers row already exists
  const { data: existing } = await adminSupabase
    .from("sellers")
    .select("id")
    .eq("id", ctx.user.id)
    .single();

  if (existing) return conflict("Already onboarded");

  // Get profile for name-based slug
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", ctx.user.id)
    .single();

  const slugBase = business_name ?? profile?.full_name ?? "seller";
  const slug = generateSlug(slugBase);

  // Insert sellers row
  const { data: seller, error: insertErr } = await adminSupabase
    .from("sellers")
    .insert({
      id: ctx.user.id,
      slug,
      seller_type,
      business_name: business_name ?? null,
      whatsapp_number,
      city_id: city_id ?? null,
      about: about ?? null,
      website: website || null,
      rera_number: rera_number ?? null,
      kyc_status: "not_submitted",
    })
    .select("id, slug, seller_type")
    .single();

  if (insertErr) {
    console.error("seller insert error", insertErr);
    return serverError("Failed to create seller profile");
  }

  // Update profile role to seller
  const { error: roleErr } = await adminSupabase
    .from("profiles")
    .update({ role: "seller" })
    .eq("id", ctx.user.id);

  if (roleErr) {
    console.error("role update error", roleErr);
    // Non-fatal — seller row is created; role sync can be retried
  }

  return created({ seller_type: seller.seller_type, slug: seller.slug });
}
