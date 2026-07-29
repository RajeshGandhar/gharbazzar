import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------
export async function getAdminDashboardStats() {
  const supabase = createAdminClient();
  const fourHoursAgo = new Date(Date.now() - 14_400_000).toISOString();

  const [
    pendingApprovals,
    pendingKyc,
    openReports,
    activeListings,
    totalSellers,
    totalProfiles,
    recentApprovals,
    recentStrikes,
    auditLogRecent,
    slaBreached,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    supabase
      .from("kyc_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("property_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("approval_status", "approved"),
    supabase.from("sellers").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("properties")
      .select(
        "id, title, approved_at, sellers!seller_id(business_name, profiles!id(full_name))"
      )
      .eq("approval_status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(5),
    supabase
      .from("strikes")
      .select("id, user_id, reason_code, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending")
      .lt("created_at", fourHoursAgo),
  ]);

  return {
    pending_approvals: pendingApprovals.count ?? 0,
    pending_kyc: pendingKyc.count ?? 0,
    open_reports: openReports.count ?? 0,
    active_listings: activeListings.count ?? 0,
    total_sellers: totalSellers.count ?? 0,
    total_profiles: totalProfiles.count ?? 0,
    recent_approvals: (recentApprovals.data ?? []) as unknown as Array<{
      id: string;
      title: string;
      approved_at: string | null;
      sellers: {
        business_name: string | null;
        profiles: { full_name: string } | null;
      } | null;
    }>,
    recent_strikes: recentStrikes.data ?? [],
    audit_log_recent: auditLogRecent.data ?? [],
    sla_breached_count: slaBreached.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Approval queue
// ---------------------------------------------------------------------------
export async function listPendingApprovals(limit = 50) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, title, slug, purpose, price, city_id, created_at, quality_score, latitude, longitude,
       cities!city_id(name),
       sellers!seller_id(business_name, seller_type, profiles!id(full_name, email)),
       property_images(path, is_cover, position)`
    )
    .eq("approval_status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Approval detail
// ---------------------------------------------------------------------------
export async function getPropertyForReview(id: string) {
  const supabase = createAdminClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      `id, title, slug, description, purpose, price, quality_score,
       city_id, area_id, latitude, longitude, address, landmark, pincode,
       bedrooms, bathrooms, balconies, built_up_area, carpet_area, plot_area,
       area_unit, floor_number, total_floors, parking_spaces, facing,
       furnishing, construction_status, rental_kind, seller_id,
       approval_status, rejection_reason, created_at, updated_at,
       cities!city_id(name),
       areas!area_id(name),
       sellers!seller_id(id, business_name, seller_type, kyc_status, is_verified, profiles!id(full_name, email)),
       property_images(id, path, thumbnail_path, is_cover, position),
       property_amenities(amenity_id, amenities(id, name, slug, icon))`
    )
    .eq("id", id)
    .single();

  if (error || !property) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { count: duplicateCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", property.seller_id)
    .eq("city_id", property.city_id)
    .eq("purpose", property.purpose)
    .neq("id", id)
    .gte("created_at", thirtyDaysAgo);

  return {
    property,
    image_count: (property.property_images ?? []).length,
    duplicate_count: duplicateCount ?? 0,
  };
}

// ---------------------------------------------------------------------------
// KYC queue
// ---------------------------------------------------------------------------
export async function listPendingKyc() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("kyc_documents")
    .select(
      `id, doc_type, file_path, status, created_at, seller_id,
       sellers!seller_id(id, business_name, seller_type, profiles!id(full_name, email))`
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// KYC detail
// ---------------------------------------------------------------------------
export async function getKycDocument(id: string) {
  const supabase = createAdminClient();

  const { data: doc, error } = await supabase
    .from("kyc_documents")
    .select(
      `id, doc_type, file_path, status, remarks, reviewed_by, reviewed_at, created_at, seller_id,
       sellers!seller_id(id, business_name, seller_type, kyc_status, is_verified, verified_at, profiles!id(full_name, email, avatar_url))`
    )
    .eq("id", id)
    .single();

  if (error || !doc) return null;

  const { data: allDocs } = await supabase
    .from("kyc_documents")
    .select("id, doc_type, file_path, status, remarks, created_at")
    .eq("seller_id", doc.seller_id)
    .order("created_at", { ascending: false });

  return { doc, all_docs: allDocs ?? [] };
}

// ---------------------------------------------------------------------------
// Reports queue
// ---------------------------------------------------------------------------
export async function listOpenReports() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("property_reports")
    .select(
      `id, property_id, reporter_id, reason, details, status, created_at,
       properties!property_id(id, title, slug, status)`
    )
    .eq("status", "open")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Users list
// ---------------------------------------------------------------------------
export async function listUsers(opts: {
  role?: string;
  q?: string;
  activeOnly?: boolean;
  page?: number;
}) {
  const supabase = createAdminClient();
  const page = opts.page ?? 1;
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("profiles")
    .select(
      `id, full_name, email, phone, role, is_active, avatar_url, created_at,
       sellers!id(seller_type, kyc_status, is_verified)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.role) query = query.eq("role", opts.role as "super_admin" | "seller" | "customer");
  if (opts.activeOnly === false) query = query.eq("is_active", false);
  if (opts.q) {
    query = query.or(`full_name.ilike.%${opts.q}%,email.ilike.%${opts.q}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return { users: data ?? [], total: count ?? 0, page, perPage };
}

// ---------------------------------------------------------------------------
// User 360 view
// ---------------------------------------------------------------------------
export async function getUserFull(id: string) {
  const supabase = createAdminClient();

  const [profile, seller, listings, strikes, tickets, auditLogs] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone, role, is_active, avatar_url, created_at, last_seen_at"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("sellers")
        .select(
          "id, business_name, slug, seller_type, kyc_status, is_verified, verified_at, avg_rating, total_reviews, created_at"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("properties")
        .select(
          "id, title, slug, purpose, status, approval_status, price, created_at, published_at"
        )
        .eq("seller_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("strikes")
        .select(
          "id, reason_code, details, issued_by, expires_at, created_at"
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("support_tickets")
        .select("id, subject, status, priority, created_at, channel")
        .eq("requester_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("audit_logs")
        .select(
          "id, action, entity_type, entity_id, created_at, new_data"
        )
        .eq("actor_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!profile.data) return null;

  return {
    profile: profile.data,
    seller: seller.data ?? null,
    listings: listings.data ?? [],
    strikes: strikes.data ?? [],
    tickets: tickets.data ?? [],
    audit_logs: auditLogs.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Field CRM prospects
// ---------------------------------------------------------------------------
export async function listProspects() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("seller_onboarding")
    .select(
      `id, prospect_name, prospect_phone, seller_type, city_id, locality_note,
       stage, notes, next_action_at, seller_id, created_at, updated_at,
       cities!city_id(name),
       profiles!assignee_id(full_name)`
    )
    .order("next_action_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------
export async function listSupportTickets(status?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("support_tickets")
    .select(
      `id, subject, channel, category, priority, status, created_at,
       first_response_at, resolved_at, assignee_id, requester_id,
       contact_name, contact_email, contact_phone,
       profiles!requester_id(full_name, email)`
    )
    .order("created_at", { ascending: true });

  if (status && status !== "all") {
    query = query.eq("status", status as "open" | "pending_user" | "resolved" | "closed");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Support ticket detail
// ---------------------------------------------------------------------------
export async function getSupportTicket(id: string) {
  const supabase = createAdminClient();

  const [ticket, messages] = await Promise.all([
    supabase
      .from("support_tickets")
      .select(
        `id, subject, channel, category, priority, status, created_at,
         first_response_at, resolved_at, assignee_id, requester_id,
         contact_name, contact_email, contact_phone,
         profiles!requester_id(id, full_name, email, avatar_url, is_active, created_at)`
      )
      .eq("id", id)
      .single(),
    supabase
      .from("ticket_messages")
      .select("id, ticket_id, author_id, is_internal, body, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket.data) return null;

  let requesterListingCount = 0;
  let requesterStrikeCount = 0;
  if (ticket.data.requester_id) {
    const [lc, sc] = await Promise.all([
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", ticket.data.requester_id),
      supabase
        .from("strikes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ticket.data.requester_id),
    ]);
    requesterListingCount = lc.count ?? 0;
    requesterStrikeCount = sc.count ?? 0;
  }

  return {
    ticket: ticket.data,
    messages: messages.data ?? [],
    requester_listing_count: requesterListingCount,
    requester_strike_count: requesterStrikeCount,
  };
}

// ---------------------------------------------------------------------------
// Seed data queries
// ---------------------------------------------------------------------------
export async function listCities() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, district, state, region_id, position, is_active")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAreas(cityId?: number) {
  const supabase = createAdminClient();
  let query = supabase
    .from("areas")
    .select(
      "id, city_id, name, slug, pincode, latitude, longitude, is_active, cities!city_id(name)"
    )
    .order("name", { ascending: true });
  if (cityId) query = query.eq("city_id", cityId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listAllUniversities() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("universities")
    .select(
      "id, name, slug, institution_type, city_id, latitude, longitude, website, logo_url, is_active, created_at, cities!city_id(name)"
    )
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllAmenities() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("amenities")
    .select("id, name, slug, icon, is_active")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllPropertyTypes() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("property_types")
    .select("id, name, slug, category, icon, is_active, position")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAllSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_by, updated_at")
    .order("key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
