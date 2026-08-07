import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Route prefixes that require an authenticated session. Role enforcement
 *  happens in the section layouts (server-side) + RLS as the final gate. */
const PROTECTED_PREFIXES = ["/admin", "/dealer", "/account"];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defense-in-depth: reject cross-origin mutating API requests.
 * Browsers always send `Origin` on POST/PUT/PATCH/DELETE fetches; a request
 * carrying an Origin that doesn't match the host that received it is either
 * cross-site or forged. Requests with NO Origin header are allowed through —
 * that's the normal shape for server-to-server calls (Vercel Cron, curl, etc.)
 */
function isForgedCrossOriginRequest(request: NextRequest): boolean {
  if (!request.nextUrl.pathname.startsWith("/api/")) return false;
  if (!MUTATING_METHODS.has(request.method)) return false;

  const origin = request.headers.get("origin");
  if (!origin) return false; // non-browser caller — allow

  return origin !== request.nextUrl.origin;
}

export async function proxy(request: NextRequest) {
  if (isForgedCrossOriginRequest(request)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Cross-origin request rejected" } },
      { status: 403 }
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    }
  );

  // Refreshes the auth token if expired — required on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
