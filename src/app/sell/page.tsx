import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Home,
  MessageSquare,
  Settings,
  Shield,
  Star,
  UserCheck,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { cn } from "@/lib/utils";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "List Your Property for Free — Sell or Rent in Mathura, Vrindavan & NCR",
  description:
    "List your property for free on GharBazaar. Reach verified buyers and tenants in Mathura, Vrindavan and Delhi NCR. 5 minutes to publish. Zero brokerage.",
};

const WHATSAPP_NUMBER = "919999999999"; // ops team number — replace at launch
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi, I want to list my property on GharBazaar. Can you help me?"
);

export default function SellPage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background py-16 sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-4 text-primary border-primary/20 bg-primary/10"
            >
              Free to list · Always
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              List your property for{" "}
              <span className="text-primary">free</span>.
              <br />
              Reach verified buyers &amp; tenants.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Mathura · Vrindavan · Delhi · Noida · Greater Noida. Verified
              seekers, real leads, WhatsApp notifications. Publish in 5 minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/login?next=/dealer/listings/new"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Start listing
                <ArrowRight className="h-4 w-4" />
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
                Get free listing help
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground">
              From account to published listing in 5 minutes.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                icon: UserCheck,
                title: "Create your account",
                desc: "Sign up free with your email or Google. Takes 30 seconds.",
              },
              {
                step: "2",
                icon: Building2,
                title: "Submit your listing",
                desc: "Fill a simple form — photos, price, location, details. Our 5-minute wizard guides you through.",
              },
              {
                step: "3",
                icon: Zap,
                title: "Get verified leads",
                desc: "Leads come via WhatsApp notification the moment a buyer contacts you.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card
                key={step}
                className="relative overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-smooth"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
                      {step}
                    </div>
                    <div>
                      <div className="mb-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seller types ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Who lists on GharBazaar?
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Home,
                title: "Owner",
                desc: "You own 1–3 properties and want direct control over who you sell or rent to. No middlemen.",
              },
              {
                icon: UserCheck,
                title: "Agent / Dealer",
                desc: "You manage a client portfolio. GharBazaar helps you showcase listings and build a trusted profile.",
              },
              {
                icon: Building2,
                title: "Builder",
                desc: "You develop new projects. Create project pages with floor plans, pricing and possession timeline.",
              },
              {
                icon: Settings,
                title: "Property Manager",
                desc: "You manage rental stock on behalf of owners. Multi-listing tools and bulk upload coming soon.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-smooth"
              >
                <div className="rounded-xl bg-primary/10 p-3 w-fit mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why GharBazaar ───────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Why sellers choose GharBazaar
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: CheckCircle2,
                title: "Free to list",
                desc: "Listing is always free. We charge nothing until you choose a premium plan.",
              },
              {
                icon: Shield,
                title: "Verified seekers only",
                desc: "Every person who contacts you has verified their mobile number. No spam leads.",
              },
              {
                icon: MessageSquare,
                title: "WhatsApp lead notifications",
                desc: "Leads come straight to your WhatsApp the moment a buyer inquires.",
              },
              {
                icon: Clock,
                title: "Assisted listing",
                desc: "No time? WhatsApp our ops team and we&apos;ll list your property within 15 minutes.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3"
              >
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Assisted listing CTA ─────────────────────────────────── */}
      <section className="border-y border-border bg-gradient-to-r from-primary/5 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:justify-between">
            <div className="max-w-lg">
              <h2 className="text-xl font-bold text-foreground">
                Don&apos;t have time to list yourself?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                WhatsApp us your property details and our team will list it for
                you within 15 minutes — for free.
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 shrink-0")}
            >
              <WhatsAppIcon className="h-4 w-4 fill-white" />
              WhatsApp us now
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              {
                q: "Is it really free?",
                a: "Yes, listing is completely free. Seekers are also free to contact you. We plan to introduce optional premium features in the future, but the core listing and lead generation is always free for founding sellers.",
              },
              {
                q: "How do I get leads?",
                a: "When a seeker clicks &ldquo;Reveal phone number&rdquo; or sends an inquiry, you get an instant WhatsApp notification with their name and mobile number. You can call or WhatsApp them directly — there's no middleman.",
              },
              {
                q: "What is seller verification?",
                a: "Verified sellers have submitted a government ID or RERA certificate that our ops team has reviewed. Verified badge builds trust with seekers and improves your listing ranking.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: a }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-gradient-to-b from-primary/8 to-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <Badge
              variant="secondary"
              className="text-primary border-primary/20 bg-primary/10"
            >
              Founding seller offer
            </Badge>
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Join founding sellers — free until we reach 500 listings
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Early sellers get priority placement, verified badge review, and a
            dedicated ops contact. No credit card, no commitment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login?next=/dealer/listings/new"
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Start listing now — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
