import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateInquiryInput, CreateVisitInput } from "../schemas";

// ---------------------------------------------------------------------------
// Lead (inquiry) mutations
// ---------------------------------------------------------------------------

export async function createInquiry(
  input: CreateInquiryInput,
  customerId?: string
) {
  const supabase = await createClient();

  // Resolve seller from property
  let sellerId: string | undefined;
  if (input.property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("seller_id")
      .eq("id", input.property_id)
      .eq("status", "active")
      .single();
    sellerId = prop?.seller_id;
  }

  if (!sellerId) {
    return { data: null, error: new Error("Property not found or unavailable") };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      property_id: input.property_id ?? null,
      seller_id: sellerId,
      customer_id: customerId ?? null,
      name: input.name,
      email: input.email || null,
      phone: input.phone,
      message: input.message ?? null,
      source: input.source,
    })
    .select("id, created_at")
    .single();

  if (!error && data) {
    // Enqueue email notification to seller (fire-and-forget)
    const admin = createAdminClient();
    void admin.from("notification_outbox").insert({
      user_id: sellerId,
      channel: "email",
      template: "new_inquiry",
      payload: {
        inquiry_id: data.id,
        property_id: input.property_id,
        seeker_name: input.name,
        seeker_phone: input.phone,
      },
    });

    // In-app notification
    void admin.from("notifications").insert({
      user_id: sellerId,
      type: "new_inquiry",
      title: "New lead received",
      body: `${input.name} is interested in your property.`,
      payload: { inquiry_id: data.id, property_id: input.property_id },
    });
  }

  return { data, error };
}

// ---------------------------------------------------------------------------
// Visit appointment mutations
// ---------------------------------------------------------------------------

export async function createVisit(input: CreateVisitInput, customerId: string) {
  const supabase = await createClient();

  const { data: prop } = await supabase
    .from("properties")
    .select("seller_id")
    .eq("id", input.property_id)
    .eq("status", "active")
    .single();

  if (!prop?.seller_id) {
    return { data: null, error: new Error("Property not found or unavailable") };
  }

  const { data, error } = await supabase
    .from("visit_appointments")
    .insert({
      property_id: input.property_id,
      seller_id: prop.seller_id,
      customer_id: customerId,
      scheduled_at: input.scheduled_at,
      notes: input.notes || null,
    })
    .select("id, scheduled_at, status")
    .single();

  if (!error && data) {
    const admin = createAdminClient();
    const { data: customerProfile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", customerId)
      .single();
    const seekerName = customerProfile?.full_name ?? "A seeker";

    // Enqueue email notification to seller (fire-and-forget)
    void admin.from("notification_outbox").insert({
      user_id: prop.seller_id,
      channel: "email",
      template: "visit_requested",
      payload: {
        visit_id: data.id,
        property_id: input.property_id,
        scheduled_at: input.scheduled_at,
        seeker_name: seekerName,
        seeker_phone: customerProfile?.phone ?? null,
      },
    });

    // In-app notification
    void admin.from("notifications").insert({
      user_id: prop.seller_id,
      type: "visit_requested",
      title: "New visit request",
      body: `${seekerName} requested a visit on ${new Date(input.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.`,
      payload: { visit_id: data.id, property_id: input.property_id },
    });
  }

  return { data, error };
}

export async function updateInquiryStatus(
  inquiryId: string,
  sellerId: string,
  status: string,
  notes?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status: status as never, notes: notes ?? undefined })
    .eq("id", inquiryId)
    .eq("seller_id", sellerId)
    .select("id, status")
    .single();
  return { data, error };
}
