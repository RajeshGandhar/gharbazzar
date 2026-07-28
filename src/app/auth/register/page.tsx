"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Enter a valid email address");

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setErrorMsg("");

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0].message);
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const origin = window.location.origin;

    // Supabase OTP creates account if it doesn't exist, signs in if it does
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      if (error.message.toLowerCase().includes("rate limit")) {
        setErrorMsg("Too many requests. Please wait a minute before trying again.");
      } else {
        setErrorMsg(error.message);
      }
      return;
    }

    setStatus("sent");
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            GharBazaar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Free for seekers. Always.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent an account activation link to{" "}
              <strong className="text-foreground">{email}</strong>. It expires in
              24 hours.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            {errorMsg && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            )}

            {/* Google OAuth */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="register-email">Email address</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!emailError}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send activation link
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/auth/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
