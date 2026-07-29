export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  region_id: z.number().nullable().optional(),
  position: z.number().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid request body", parsed.error.flatten());

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cities")
    .update(parsed.data)
    .eq("id", Number(id))
    .select()
    .single();

  if (error) return serverError(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "seed.city.updated",
    entity_type: "city",
    entity_id: id,
    new_data: parsed.data as unknown as import("@/types/database.types").Json,
  });

  return ok(data);
}
