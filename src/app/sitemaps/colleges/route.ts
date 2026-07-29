import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 86400; // 24 hours

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

/**
 * GET /sitemaps/colleges — XML sitemap for active university/college pages.
 * Inventory gating (≥3 live listings) is enforced via noindex on the page itself.
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data: unis } = await supabase
    .from("universities")
    .select("slug, created_at")
    .eq("is_active", true)
    .order("name");

  const rows = (unis ?? []) as Array<{ slug: string; created_at: string }>;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((u) => `  <url>
    <loc>${SITE_URL}/college/${u.slug}</loc>
    <lastmod>${u.created_at ? new Date(u.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
