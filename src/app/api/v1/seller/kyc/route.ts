import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSeller } from "@/lib/api/middleware";
import { createAdminClient } from "@/lib/supabase/admin";
import { badRequest, created, ok, serverError, unauthorized } from "@/lib/api/response";

export const runtime = "nodejs";

const kycSubmitSchema = z.object({
  doc_type: z.string().min(1).max(60),
  file_path: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const { data, error } = await ctx.supabase
    .from("kyc_documents")
    .select("id, doc_type, file_path, status, remarks, created_at")
    .eq("seller_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("kyc fetch error", error);
    return serverError("Failed to fetch KYC documents");
  }

  return ok(data);
}

export async function POST(req: NextRequest) {
  const ctx = await requireSeller(req);
  if (!ctx) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = kycSubmitSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid input", parsed.error.flatten());

  const { doc_type, file_path } = parsed.data;
  const adminSupabase = createAdminClient();

  // Insert the KYC document
  const { data: doc, error: insertErr } = await adminSupabase
    .from("kyc_documents")
    .insert({
      seller_id: ctx.user.id,
      doc_type,
      file_path,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("kyc insert error", insertErr);
    return serverError("Failed to submit document");
  }

  // Check if this is the seller's first doc — if so, update kyc_status to submitted
  const { count } = await adminSupabase
    .from("kyc_documents")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", ctx.user.id);

  if ((count ?? 0) <= 1) {
    await adminSupabase
      .from("sellers")
      .update({ kyc_status: "submitted" })
      .eq("id", ctx.user.id);
  }

  return created({ id: doc.id });
}
