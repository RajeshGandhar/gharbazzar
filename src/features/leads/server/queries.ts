import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// ---------------------------------------------------------------------------
// Lead (inquiry) queries
// ---------------------------------------------------------------------------

export async function listSellerLeads(
  sellerId: string,
  pagination: PaginationParams,
  status?: string
) {
  const supabase = await createClient();
  const { from, to } = toRange(pagination);

  let q = supabase
    .from("inquiries")
    .select(
      `
      id, name, email, phone, message, source, status, notes, created_at, updated_at,
      properties!property_id ( id, slug, title, cities!city_id ( name ) ),
      profiles!customer_id ( id, full_name, avatar_url )
    `,
      { count: "exact" }
    )
    .eq("seller_id", sellerId);

  if (status) q = q.eq("status", status as never);

  const { data, count, error } = await q
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data, count: count ?? 0, error };
}

export async function getInquiryById(inquiryId: string, sellerId: string) {
  const supabase = await createClient();
  return supabase
    .from("inquiries")
    .select(
      `
      id, name, email, phone, message, source, status, notes, created_at, updated_at,
      properties!property_id ( id, slug, title ),
      profiles!customer_id ( id, full_name, avatar_url, phone )
    `
    )
    .eq("id", inquiryId)
    .eq("seller_id", sellerId)
    .single();
}
