import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Auth + role middleware for Route Handlers
// ---------------------------------------------------------------------------

type UserRole = Database["public"]["Enums"]["user_role"];

export interface AuthContext {
  user: User;
  supabase: SupabaseClient<Database>;
}

/**
 * Returns the current user and supabase client, or null if unauthenticated.
 * Route handlers call this then guard with unauthorized() as needed.
 */
export async function getAuthContext(
  _req: NextRequest
): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { user, supabase };
}

/**
 * Ensures the caller has at least the given role. Returns the auth context
 * or null (caller must respond with unauthorized/forbidden).
 */
export async function requireRole(
  req: NextRequest,
  ...roles: UserRole[]
): Promise<(AuthContext & { role: UserRole }) | null> {
  const ctx = await getAuthContext(req);
  if (!ctx) return null;

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.user.id)
    .single();

  if (!profile || !roles.includes(profile.role)) return null;
  return { ...ctx, role: profile.role };
}

export async function requireAdmin(req: NextRequest) {
  return requireRole(req, "super_admin");
}

export async function requireSeller(req: NextRequest) {
  return requireRole(req, "seller", "super_admin");
}
