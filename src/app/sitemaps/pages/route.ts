import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

/**
 * GET /sitemaps/pages — XML sitemap for static/marketing pages and the
 * hardcoded launch-city hub pages (not DB-backed, so no query needed).
 */
export async function GET() {
  const now = new Date().toISOString().split("T")[0];

  const entries: Array<{ path: string; changefreq: string; priority: number }> = [
    { path: "/",                                changefreq: "daily",  priority: 1.0 },
    { path: "/buy",                             changefreq: "daily",  priority: 0.9 },
    { path: "/rent",                            changefreq: "daily",  priority: 0.9 },
    { path: "/student-housing",                 changefreq: "daily",  priority: 0.9 },
    // City buy pages
    { path: "/buy/mathura",                     changefreq: "hourly", priority: 0.85 },
    { path: "/buy/vrindavan",                   changefreq: "hourly", priority: 0.85 },
    { path: "/buy/noida",                       changefreq: "hourly", priority: 0.8 },
    { path: "/buy/delhi",                       changefreq: "hourly", priority: 0.8 },
    { path: "/buy/gurgaon",                     changefreq: "hourly", priority: 0.75 },
    { path: "/buy/greater-noida",               changefreq: "hourly", priority: 0.75 },
    { path: "/buy/faridabad",                   changefreq: "hourly", priority: 0.75 },
    { path: "/buy/ghaziabad",                   changefreq: "hourly", priority: 0.75 },
    // City rent pages
    { path: "/rent/mathura",                    changefreq: "hourly", priority: 0.85 },
    { path: "/rent/vrindavan",                  changefreq: "hourly", priority: 0.85 },
    { path: "/rent/noida",                      changefreq: "hourly", priority: 0.8 },
    { path: "/rent/delhi",                      changefreq: "hourly", priority: 0.8 },
    { path: "/rent/gurgaon",                    changefreq: "hourly", priority: 0.75 },
    { path: "/rent/greater-noida",              changefreq: "hourly", priority: 0.75 },
    { path: "/rent/faridabad",                  changefreq: "hourly", priority: 0.75 },
    { path: "/rent/ghaziabad",                  changefreq: "hourly", priority: 0.75 },
    // Student housing city pages
    { path: "/student-housing/mathura",         changefreq: "daily",  priority: 0.85 },
    { path: "/student-housing/vrindavan",       changefreq: "daily",  priority: 0.8 },
    { path: "/student-housing/noida",           changefreq: "daily",  priority: 0.8 },
    { path: "/student-housing/delhi",           changefreq: "daily",  priority: 0.75 },
    { path: "/student-housing/gurgaon",         changefreq: "daily",  priority: 0.7 },
    { path: "/student-housing/greater-noida",   changefreq: "daily",  priority: 0.7 },
    // Dealer directories
    { path: "/property-dealers/mathura",        changefreq: "daily",  priority: 0.75 },
    { path: "/property-dealers/vrindavan",      changefreq: "daily",  priority: 0.75 },
    { path: "/property-dealers/noida",          changefreq: "daily",  priority: 0.7 },
    { path: "/property-dealers/delhi",          changefreq: "daily",  priority: 0.7 },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${SITE_URL}${e.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
