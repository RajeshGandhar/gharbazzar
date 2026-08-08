"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Enter a valid email address");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
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

    // Since GharBazaar uses magic link / OTP, "forgot password" sends a sign-in link.
    // This is semantically correct: the user has no password to reset.
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
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

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            GharBazaar
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            Access your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a sign-in link.
          </p>
        </div>

        {status === "sent" ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Sign-in link sent</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a sign-in link to{" "}
              <strong className="text-foreground">{email}</strong>. Click the
              link in your email to access your account. It expires in 24 hours.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6">
            {errorMsg && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fp-email">Email address</Label>
                <Input
                  id="fp-email"
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
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send sign-in link
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered your details?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Lost access to your email account entirely?{" "}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_OPS_NUMBER ?? ""}?text=${encodeURIComponent("Hi, I need help recovering my GharBazaar account. I've lost access to my registered email address.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Contact support on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
