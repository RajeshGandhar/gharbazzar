import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Info,
  Star,
  StarOff,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { listSellers } from "@/features/sellers/server/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

// Same hardcoded launch-city list used by /buy/[city] and /rent/[city] — no
// DB call at build time. Brings this route's ISR strategy in line with
// those (it previously had revalidate but no generateStaticParams, so it
// was purely on-demand rather than pre-built).
const LAUNCH_CITIES = [
  "mathura", "vrindavan", "delhi", "noida",
  "greater-noida", "gurgaon", "faridabad", "ghaziabad",
];

export function generateStaticParams() {
  return LAUNCH_CITIES.map((city) => ({ city }));
}

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
};

const sellerTypeLabel: Record<string, string> = {
  owner: "Owner",
  agent: "Agent",
  builder: "Builder",
  property_manager: "Property Manager",
};

const typeOptions = [
  { value: "", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "agent", label: "Agent" },
  { value: "builder", label: "Builder" },
  { value: "property_manager", label: "Property Manager" },
];

async function getCityBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, state")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return { title: "City not found" };

  return {
    title: `Property Dealers in ${city.name} — Verified Agents & Owners | GharBazaar`,
    description: `Find verified property dealers, agents, owners and builders in ${city.name}. Direct contact, verified profiles, real listings on GharBazaar.`,
    alternates: { canonical: `/property-dealers/${citySlug}` },
  };
}

export default async function DealerDirectoryPage({ params, searchParams }: Props) {
  const { city: citySlug } = await params;
  const { type, page: pageStr } = await searchParams;

  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const perPage = 20;
  const activeType = type ?? "";

  const { data: sellers, count } = await listSellers({
    citySlug,
    sellerType: activeType || undefined,
    pagination: { page, perPage },
  });

  const sellerList = sellers ?? [];
  const verifiedCount = sellerList.filter((s) => s.is_verified).length;

  function buildTypeUrl(t: string): string {
    const p = new URLSearchParams();
    if (t) p.set("type", t);
    return `/property-dealers/${citySlug}${p.toString() ? `?${p.toString()}` : ""}`;
  }

  function paginationBase(): string {
    const p = new URLSearchParams();
    if (activeType) p.set("type", activeType);
    return `/property-dealers/${citySlug}${p.toString() ? `?${p.toString()}` : ""}`;
  }

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/20">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li><Link href="/" className="hover:text-primary transition-smooth">Home</Link></li>
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li><span>Property Dealers</span></li>
            <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="font-medium text-foreground">{city.name}</li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/8 to-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Property Dealers in {city.name}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {(count ?? 0).toLocaleString("en-IN")} registered dealer{count !== 1 ? "s" : ""} · {verifiedCount} verified
          </p>

          {(count ?? 0) < 5 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-card p-4 max-w-lg">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                We&apos;re actively onboarding verified dealers in {city.name}.
                If you&apos;re a dealer or agent, list your first property free and get a verified badge within 24 hours.
                <Link href="/sell" className="ml-1 text-primary font-medium hover:underline">
                  Join now →
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Type filter + Grid */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Type filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {typeOptions.map(({ value, label }) => {
            const isActive = activeType === value;
            return (
              <Link
                key={label}
                href={buildTypeUrl(value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-smooth",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {sellerList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="rounded-xl bg-muted p-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              No{activeType ? ` ${sellerTypeLabel[activeType]}` : ""} dealers yet in {city.name}
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm">
              Be the first to list your property in {city.name}.
            </p>
            <Link href="/sell" className={cn(buttonVariants())}>
              List your property free
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {sellerList.map((seller) => {
                const s = seller as typeof seller & {
                  profiles?: { full_name: string | null; avatar_url: string | null } | null;
                  cities?: { name: string; slug: string } | null;
                };
                const name = s.business_name || s.profiles?.full_name || "Seller";
                // whatsapp_number is in the seller record from the listSellers query
                const wa = (s as unknown as { whatsapp_number?: string | null }).whatsapp_number;

                return (
                  <Link
                    key={s.id}
                    href={`/seller/${s.slug}`}
                    className="group rounded-xl border border-border bg-card p-5 transition-smooth hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-xl shrink-0">
                        <AvatarImage src={s.logo_url || s.profiles?.avatar_url || undefined} alt={name} />
                        <AvatarFallback className="rounded-xl font-semibold bg-primary/10 text-primary">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge variant="secondary" className="text-[10px] py-0">
                            {sellerTypeLabel[s.seller_type] ?? s.seller_type}
                          </Badge>
                          {s.is_verified && (
                            <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                              <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-foreground group-hover:text-primary transition-smooth text-sm truncate">
                          {name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {(s.avg_rating ?? 0) > 0 ? (
                            <>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs text-muted-foreground">
                                {(s.avg_rating ?? 0).toFixed(1)} ({s.total_reviews})
                              </span>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <StarOff className="h-3 w-3" />
                              No reviews
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">View profile →</span>
                      {wa && (
                        <a
                          href={`https://wa.me/91${wa}?text=Hi%2C%20I%20found%20your%20profile%20on%20GharBazaar.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-lg bg-green-950 border border-green-800 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-900 transition-smooth"
                        >
                          <WhatsAppIcon className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <Pagination
              page={page}
              perPage={perPage}
              total={count ?? 0}
              baseUrl={paginationBase()}
            />
          </>
        )}
      </section>
    </div>
  );
}
