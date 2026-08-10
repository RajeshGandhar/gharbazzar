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

  const supabase = await createClient();

  // Magic link / email OTP (PKCE email template sends token_hash + type)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      console.error("[auth/callback] OTP verify failed:", error.message);
    } else {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Google OAuth / PKCE code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
    } else {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (!code && !tokenHash) {
    console.error("[auth/callback] No code or token_hash in URL params:", Object.fromEntries(searchParams));
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
