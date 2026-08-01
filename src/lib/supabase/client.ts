import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Client Components (browser).
 * Session is stored in cookies and shared with the server via @supabase/ssr.
 *
 * `httpOnly` is intentionally NOT set: the browser client reads/writes the
 * session cookie via `document.cookie` (e.g. contact-reveal's client-side
 * `getUser()` check, both sign-out buttons), so an httpOnly cookie would
 * break those working flows. `secure`/`sameSite` are set explicitly instead
 * as the safe, non-breaking half of that hardening — see next.config.ts for
 * the accompanying CSP tightening (object-src/base-uri).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    }
  );
}
