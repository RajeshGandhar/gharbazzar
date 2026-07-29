import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 86400; // 24 hours

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

/**
 * GET /sitemaps/sellers — XML sitemap for verified seller profiles with active listings.
 */
export async function GET() {
  const supabase = createAdminClient();

  // Verified sellers
  const { data } = await supabase
    .from("sellers")
    .select("slug, updated_at")
    .eq("kyc_status", "verified")
    .order("updated_at", { ascending: false })
    .limit(10000);

  const rows = data ?? [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((s) => `  <url>
    <loc>${SITE_URL}/seller/${s.slug}</loc>
    <lastmod>${s.updated_at ? new Date(s.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
