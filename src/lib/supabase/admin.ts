import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — BYPASSES Row Level Security.
 *
 * SERVER ONLY. Never import from a Client Component and never expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser. Used for: admin operations,
 * notification fan-out, payment webhooks, logging, invoice generation.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must never run in the browser");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
