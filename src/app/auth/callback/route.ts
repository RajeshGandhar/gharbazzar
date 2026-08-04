import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  // #region agent log
  fetch("http://127.0.0.1:7876/ingest/9377d0da-0fda-4647-9ccf-573fdc34b7ce", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a1b27c" },
    body: JSON.stringify({
      sessionId: "a1b27c",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "auth/callback/route.ts:entry",
      message: "callback params received",
      data: {
        hasCode: !!code,
        hasTokenHash: !!tokenHash,
        type,
        next,
        paramKeys: [...searchParams.keys()],
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const supabase = await createClient();

  // Magic link / email OTP (PKCE email template sends token_hash + type)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    // #region agent log
    fetch("http://127.0.0.1:7876/ingest/9377d0da-0fda-4647-9ccf-573fdc34b7ce", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a1b27c" },
      body: JSON.stringify({
        sessionId: "a1b27c",
        runId: "post-fix",
        hypothesisId: "A",
        location: "auth/callback/route.ts:verifyOtp",
        message: "verifyOtp result",
        data: { success: !error, errorMessage: error?.message ?? null, type },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // #region agent log
    fetch("http://127.0.0.1:7876/ingest/9377d0da-0fda-4647-9ccf-573fdc34b7ce", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a1b27c" },
      body: JSON.stringify({
        sessionId: "a1b27c",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "auth/callback/route.ts:exchangeCode",
        message: "exchangeCodeForSession result",
        data: { success: !error, errorMessage: error?.message ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!error) {
      const redirectUrl = `${origin}${safeNext}`;
      const response = NextResponse.redirect(redirectUrl);
      // #region agent log
      fetch("http://127.0.0.1:7876/ingest/9377d0da-0fda-4647-9ccf-573fdc34b7ce", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a1b27c" },
        body: JSON.stringify({
          sessionId: "a1b27c",
          runId: "pre-fix",
          hypothesisId: "C",
          location: "auth/callback/route.ts:code-success",
          message: "redirect after code exchange",
          data: {
            redirectUrl,
            responseCookieCount: response.cookies.getAll().length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return response;
    }
  }

  // #region agent log
  fetch("http://127.0.0.1:7876/ingest/9377d0da-0fda-4647-9ccf-573fdc34b7ce", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a1b27c" },
    body: JSON.stringify({
      sessionId: "a1b27c",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "auth/callback/route.ts:fallback",
      message: "auth_failed fallback — no code or exchange failed",
      data: { hasCode: !!code, hasTokenHash: !!tokenHash, type },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
