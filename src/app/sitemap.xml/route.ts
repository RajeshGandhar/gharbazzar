import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

// ---------------------------------------------------------------------------
// GET /sitemap.xml — spec-valid <sitemapindex>, referenced from robots.txt.
//
// This replaces the previous app/sitemap.ts metadata-route implementation:
// Next's `MetadataRoute.Sitemap` type can only render a flat <urlset>, so the
// segmented sitemap URLs it listed as ordinary <url> entries were not a
// valid sitemap index — crawlers would treat them as pages to index, not
// sub-sitemaps to parse. A <sitemapindex> can only contain <sitemap>
// entries (never individual page URLs), so the static/marketing pages that
// used to live inline here now have their own sub-sitemap at
// /sitemaps/pages.
// ---------------------------------------------------------------------------
export async function GET() {
  const now = new Date().toISOString();

  const sitemaps = [
    `${SITE_URL}/sitemaps/pages`,
    `${SITE_URL}/sitemaps/listings`,
    `${SITE_URL}/sitemaps/colleges`,
    `${SITE_URL}/sitemaps/sellers`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
