import type { NextConfig } from "next";

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

// Security headers applied to all responses
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Stop leaking referrer to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict powerful browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  // Enforce HTTPS for 1 year (only meaningful in production)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // CSP — allows Supabase storage for images, Google Maps, inline scripts
  // (needed for JSON-LD <script> tags and React hydration)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + inline (JSON-LD, React) + Google Maps
      "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
      // Styles: self + inline (Tailwind/shadcn, Google Maps UI)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self + Supabase storage + Google Maps tiles + data URIs
      `img-src 'self' data: blob: https://${SUPABASE_HOST} https://*.googleapis.com https://*.gstatic.com`,
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect: self + Supabase (realtime/auth/storage)
      `connect-src 'self' https://${SUPABASE_HOST} https://*.supabase.co wss://*.supabase.co`,
      // Frames: deny
      "frame-ancestors 'none'",
      // Form submissions: only to self
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24h CDN cache for optimized images
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
