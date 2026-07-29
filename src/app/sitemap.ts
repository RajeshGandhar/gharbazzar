import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharbazaar.in";

/**
 * Index sitemap — points to segmented sitemaps.
 * Segmented sitemaps are served as route handlers under /sitemaps/.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static high-priority pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                  lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/buy`,               lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/rent`,              lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/student-housing`,   lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    // City buy pages
    { url: `${SITE_URL}/buy/mathura`,       lastModified: now, changeFrequency: "hourly",  priority: 0.85 },
    { url: `${SITE_URL}/buy/vrindavan`,     lastModified: now, changeFrequency: "hourly",  priority: 0.85 },
    { url: `${SITE_URL}/buy/noida`,         lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${SITE_URL}/buy/delhi`,         lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${SITE_URL}/buy/gurgaon`,       lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/buy/greater-noida`, lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/buy/faridabad`,     lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/buy/ghaziabad`,     lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    // City rent pages
    { url: `${SITE_URL}/rent/mathura`,      lastModified: now, changeFrequency: "hourly",  priority: 0.85 },
    { url: `${SITE_URL}/rent/vrindavan`,    lastModified: now, changeFrequency: "hourly",  priority: 0.85 },
    { url: `${SITE_URL}/rent/noida`,        lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${SITE_URL}/rent/delhi`,        lastModified: now, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${SITE_URL}/rent/gurgaon`,      lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/rent/greater-noida`,lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/rent/faridabad`,    lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    { url: `${SITE_URL}/rent/ghaziabad`,    lastModified: now, changeFrequency: "hourly",  priority: 0.75 },
    // Student housing city pages
    { url: `${SITE_URL}/student-housing/mathura`,       lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/student-housing/vrindavan`,     lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/student-housing/noida`,         lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/student-housing/delhi`,         lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${SITE_URL}/student-housing/gurgaon`,       lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/student-housing/greater-noida`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // Dealer directories
    { url: `${SITE_URL}/property-dealers/mathura`,      lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${SITE_URL}/property-dealers/vrindavan`,    lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${SITE_URL}/property-dealers/noida`,        lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/property-dealers/delhi`,        lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  // Segmented dynamic sitemaps (served as route handlers)
  const dynamicSitemaps: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/sitemaps/listings`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/sitemaps/colleges`, lastModified: now, changeFrequency: "daily",  priority: 0.7 },
    { url: `${SITE_URL}/sitemaps/sellers`,  lastModified: now, changeFrequency: "daily",  priority: 0.6 },
  ];

  return [...staticPages, ...dynamicSitemaps];
}
