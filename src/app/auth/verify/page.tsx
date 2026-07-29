"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");

    const supabase = createClient();
    const origin = window.location.origin;

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (err) {
      setError(
        err.message.toLowerCase().includes("rate limit")
          ? "Too many requests. Please wait a minute."
          : err.message
      );
    } else {
      setResent(true);
    }

    setResending(false);
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          We sent a sign-in link to{" "}
          {email ? (
            <strong className="text-foreground">{email}</strong>
          ) : (
            "your email address"
          )}
          . Click the link to access your account. It expires in 24 hours.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left">
          <p className="text-xs font-medium text-foreground mb-2">
            Didn&apos;t receive it?
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Check your spam / junk folder</li>
            <li>Make sure you entered the correct email</li>
            <li>Links expire after 24 hours</li>
          </ul>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {resent ? (
          <p className="mt-5 text-sm text-primary font-medium">
            Link resent! Check your inbox.
          </p>
        ) : email ? (
          <Button
            variant="outline"
            className="mt-5 gap-2"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resending…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Resend link
              </>
            )}
          </Button>
        ) : null}

        <p className="mt-5 text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100dvh-120px)]" />}>
      <VerifyContent />
    </Suspense>
  );
}
