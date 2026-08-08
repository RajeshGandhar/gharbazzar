import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { cn } from "@/lib/utils";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "List Your Property for Free — Sell or Rent in Mathura, Vrindavan & NCR",
  description:
    "List your property for free on GharBazaar. Reach verified buyers and tenants in Mathura, Vrindavan and Delhi NCR. 5 minutes to publish. Zero brokerage.",
};

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_OPS_NUMBER ?? "";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi, I want to list my property on GharBazaar. Can you help me?"
);

export default function SellPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              List your property for free
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Mathura · Vrindavan · Delhi · Noida · Greater Noida. Verified
              seekers, WhatsApp notifications, 5 minute setup.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth/login?next=/dealer/listings/new"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Post property
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "gap-2"
                )}
              >
                <WhatsAppIcon className="h-4 w-4 text-green-600" />
                Need help listing?
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              How it works
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create account",
                desc: "Sign up with email or Google in 30 seconds.",
              },
              {
                step: "2",
                title: "Add property details",
                desc: "Photos, price, location. Takes 5 minutes.",
              },
              {
                step: "3",
                title: "Receive leads",
                desc: "Get WhatsApp alerts when buyers contact you.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="border border-border rounded-lg p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seller types ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Who can list
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Owner",
                desc: "Direct control, no middlemen.",
              },
              {
                title: "Agent / Dealer",
                desc: "Manage client portfolios.",
              },
              {
                title: "Builder",
                desc: "New projects with floor plans.",
              },
              {
                title: "Property Manager",
                desc: "Rental stock management.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="border border-border bg-card p-4"
              >
                <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why GharBazaar ───────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Why list here
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Free to list",
                desc: "Always free. No charges.",
              },
              {
                title: "Verified seekers",
                desc: "Mobile-verified contacts only.",
              },
              {
                title: "WhatsApp alerts",
                desc: "Instant lead notifications.",
              },
              {
                title: "Listing assistance",
                desc: "WhatsApp us your details, we'll list it.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-4 border border-border rounded-lg"
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assisted listing CTA ─────────────────────────────────── */}
      <section className="border-y border-border bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Need help listing?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                WhatsApp your property details, we'll list it in 15 minutes.
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants(), "gap-2 shrink-0")}
            >
              <WhatsAppIcon className="h-4 w-4 fill-white" />
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Common questions
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes. Listing and lead generation are free. We may introduce optional premium features later.",
              },
              {
                q: "How do I get leads?",
                a: "When someone contacts you, you get a WhatsApp alert with their name and number. Contact them directly.",
              },
              {
                q: "What is seller verification?",
                a: "Submit government ID or RERA certificate. Verified badge builds trust and improves ranking.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border border-border bg-card p-5"
              >
                <h3 className="font-semibold text-foreground mb-1.5">{q}</h3>
                <p
                  className="text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: a }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Ready to list?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Free for all sellers. No credit card required.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/login?next=/dealer/listings/new"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Post property
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
