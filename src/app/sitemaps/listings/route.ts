import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

/**
 * GET /sitemaps/listings — XML sitemap for all active approved listings.
 * Capped at 50,000 entries (sitemap spec limit).
 */
export async function GET() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "active")
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50000);

  const rows = data ?? [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((r) => `  <url>
    <loc>${SITE_URL}/property/${r.slug}</loc>
    <lastmod>${r.updated_at ? new Date(r.updated_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
