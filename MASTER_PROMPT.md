# Master Prompt — Full-Stack Marketplace Application

> Copy this prompt, replace all `[BRACKETED]` placeholders with your project specifics, and use it with Claude Code to build a complete marketplace application from scratch.

---

## PROMPT START

You are my co-founder and CTO. We are building **[APP_NAME]** — a **[DESCRIPTION, e.g., "verified property listing platform for tier-2/3 Indian cities"]**.

### Tech Stack (non-negotiable)
- **Framework:** Next.js App Router (latest stable) with TypeScript strict mode
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deployment:** Vercel (Fluid Compute)
- **Validation:** Zod schemas (shared client + server)
- **Forms:** React Hook Form + @hookform/resolvers
- **Icons:** Lucide React
- **Toasts:** Sonner
- **Animation:** Framer Motion (light usage)
- **Analytics:** @vercel/analytics + @vercel/speed-insights

### Architecture Rules
1. **Server Components by default.** Only use `"use client"` when the component needs interactivity (state, effects, event handlers, browser APIs).
2. **No mock data, no placeholders, no TODO comments.** Everything shipped must work.
3. **Supabase RLS everywhere.** Never trust the client. Admin operations use `createAdminClient()` (service role). User operations use `createClient()` (anon key + cookie session).
4. **API routes at `/api/v1/`** — RESTful, Zod-validated, with standardized response helpers (`ok()`, `paginated()`, `badRequest()`, `unauthorized()`, `serverError()`, `tooManyRequests()`).
5. **Feature-based file structure:**
   ```
   src/
     app/                    # Next.js pages + API routes
     components/
       ui/                   # shadcn/ui primitives
       layout/               # Navbar, Footer, ThemeProvider
       shared/               # Reusable across features (SearchBar, Pagination, etc.)
       [feature]/            # Feature-specific components
     features/
       [feature]/
         server/queries.ts   # Server-only DB queries
         server/mutations.ts # Server-only write operations
         schemas.ts          # Zod validation schemas
         components/         # Feature-specific client components
     lib/
       supabase/server.ts    # Server Supabase client (cookies)
       supabase/client.ts    # Browser Supabase client
       supabase/admin.ts     # Service-role client (server-only)
       api/response.ts       # Standardized API response helpers
       api/middleware.ts      # Auth context extraction
       api/rate-limit.ts     # In-memory rate limiting
       api/pagination.ts     # Pagination helpers
       seo/schema.ts         # JSON-LD structured data generators
       utils/format.ts       # Display formatters (price, date, area, etc.)
       utils/storage.ts      # Supabase Storage URL helpers
     types/
       database.types.ts     # Generated from Supabase schema
   ```
6. **No ORMs.** Use Supabase client's `.from().select().eq()` query builder directly.
7. **Server actions or API routes for mutations** — never mutate directly from client components.
8. **`import "server-only"` guard** on all server query/mutation files.

### Database Design Pattern
Design a normalized PostgreSQL schema with these principles:
- **UUIDs for primary keys** (except lookup tables which use serial integers)
- **Soft delete** via `deleted_at` timestamp (never hard delete user content)
- **Audit columns** on every table: `created_at`, `updated_at`
- **Status enums** as PostgreSQL custom types (not strings)
- **Full-text search** via generated `tsvector` columns
- **RLS policies** on every table — no exceptions

Here is the domain model for **[APP_NAME]**:

**Core entities:** [LIST YOUR ENTITIES, e.g.:]
- `profiles` (extends Supabase auth.users — id, full_name, phone, role, avatar_url)
- `[PRIMARY_ENTITY, e.g., properties]` (the main listing — title, slug, description, price, status, approval_status, seller_id, city_id, area_id, quality_score, views_count, favorites_count, published_at, expires_at, deleted_at)
- `[SELLER_ENTITY, e.g., sellers]` (business profiles — business_name, slug, seller_type enum, whatsapp_number, kyc_status, is_verified, avg_rating, total_reviews)
- `cities`, `areas` (geographic hierarchy — region → city → area, all data-driven, zero code changes for new locations)
- `[CATEGORY_ENTITY, e.g., property_types]` (lookup table — name, slug, category, is_active)
- `[MEDIA_TABLE, e.g., property_images]` (path, thumbnail_path, is_cover, position)
- `[AMENITIES/FEATURES]` (many-to-many via junction table)
- `inquiries` (customer → seller leads with status pipeline: new → contacted → visit_scheduled → negotiating → closed_won/lost)
- `favorites`, `comparisons`, `recently_viewed` (seeker engagement)
- `saved_searches` (name, purpose, filters JSON, frequency enum, email_alerts boolean)
- `notifications` (in-app notification outbox)
- `[REVIEWS_TABLE]` (rating, comment, verified_transaction boolean)
- `[REPORTS_TABLE]` (user-generated content reports with reason + status)

**Enums to create:**
- [LIST YOUR ENUMS, e.g., listing_purpose: sale/rent/lease, seller_type: owner/agent/builder/property_manager, approval_status: pending/approved/rejected, kyc_status: not_submitted/pending/verified/rejected, etc.]

### User Roles & Journeys

**Role 1: [SEEKER/BUYER, e.g., "Seeker"]** (free, no registration required to browse)
- Browse → Search/Filter → View detail → Reveal contact / Send inquiry → Visit → Close deal
- Features: favorites, compare (up to 4), saved searches with alerts, recently viewed, visit scheduling

**Role 2: [SELLER/PROVIDER, e.g., "Dealer"]** (registered, KYC-verified)
- Onboard → Complete profile → Create listing (multi-step wizard with autosave) → Submit for approval → Manage leads → Respond → Track stats
- Features: listing management, leads inbox + CSV export, basic analytics dashboard, KYC submission

**Role 3: Admin** (super_admin role in profiles)
- Approve/reject listings + KYC → Manage users (strikes, deactivate) → Support tickets → Content reports → Field CRM → Seed data management (cities, areas, categories, etc.) → Platform settings
- Features: approval queues with reason codes, user management, support system, assisted listing (on-behalf-of), seeds CRUD, dashboard metrics

### Pages to Build

**Public pages:**
- `/` — Homepage: hero + search bar, platform stats (live DB counts), featured listings, "How it works" 3-step section, trust badges, intent cards, browse by city, CTA
- `/search` — Full search: filters sidebar (purpose, BHK/category, price range slider, furnishing/condition, amenities multi-select), sort options, list/map toggle, split view (list + map side by side on desktop), "Load more" infinite scroll
- `/[primary-entity]/[slug]` — Detail page: image gallery with full-screen lightbox (swipe, zoom, thumbnails), specs grid, description, amenities, [domain-specific sections], price history chart, similar listings, seller contact box (with response time badge), inquiry form, report dialog, share button, social proof ("X people viewed"), disclaimer
- `/[purpose]/[city]` — City landing pages with filters, area internal linking, SEO
- `/[purpose]/[city]/[area]` — Area/locality pages (long-tail SEO)
- `/seller/[slug]` — Seller profile: bio, stats, listings grid, reviews
- `[DOMAIN-SPECIFIC PAGES]`

**Auth pages:**
- `/auth/login` — Google OAuth + email magic link, trust bullets
- `/auth/register` — Same auth methods, terms acceptance, trust bullets
- `/auth/verify` — Email verification confirmation
- `/auth/forgot-password` — Recovery flow
- `/auth/callback` — OAuth/magic link redirect handler

**Account pages (seeker):**
- `/account/dashboard` — Greeting, stats cards, recent activity, quick links
- `/account/favorites` — Saved listings grid
- `/account/compare` — Side-by-side comparison table (all fields)
- `/account/saved-searches` — Alert management with inline frequency editor
- `/account/recently-viewed` — Browsing history
- `/account/notifications` — In-app notification inbox
- `/account/profile` — Edit profile form
- `/account/visits` — Scheduled visits list

**Seller/dealer pages:**
- `/dealer` — Redirect to dashboard or onboard
- `/dealer/onboard` — Multi-step onboarding wizard
- `/dealer/dashboard` — Stats cards (listings, leads, views, reveals), recent leads, recent listings
- `/dealer/listings` — Manage all listings with status filter
- `/dealer/listings/new` — Multi-step listing creation wizard with autosave + preview step
- `/dealer/listings/[id]/edit` — Edit existing listing
- `/dealer/leads` — Leads inbox with status pipeline
- `/dealer/leads/[id]` — Lead detail
- `/dealer/kyc` — KYC document submission
- `/dealer/profile` — Edit business profile

**Admin pages:**
- `/admin/dashboard` — Platform metrics overview
- `/admin/approvals` — Listing approval queue with reason codes
- `/admin/kyc` — KYC verification queue
- `/admin/users` — User management (search, strikes, deactivate)
- `/admin/reports` — Content report queue (dismiss/resolve)
- `/admin/support` — Support ticket queue with reply + status
- `/admin/seeds/*` — CRUD for cities, areas, categories, amenities, etc.
- `/admin/settings` — Platform-wide settings
- `/admin/field-crm` — Field team prospect tracking

**API routes (`/api/v1/`):**
- Full CRUD for listings, sellers, leads, favorites, comparisons, saved searches, notifications, visits, reports
- Search endpoint with FTS + all filters
- Search suggest/autocomplete endpoint
- Cron endpoints: alert matcher, notification drain (email), listing expiry
- Admin endpoints: approve/reject listings, verify/reject KYC, user management
- Health check endpoint

### Key Components to Build

1. **SearchBar** — Typeahead with debounced API suggestions (cities, areas, [categories])
2. **PropertyCard / ListingCard** — Image carousel (swipe + arrow nav), price overlay, badges (featured, purpose, category), save button, specs chips, freshness label
3. **Pagination** — URL-based page navigation for SEO
4. **LoadMore** — Client component that appends results via API (replaces pagination on search)
5. **PhotoGallery** — Full-screen lightbox: swipe, keyboard nav (arrows + Esc), pinch-to-zoom, double-tap zoom, pan when zoomed, thumbnail strip
6. **GalleryGrid** — Clickable image grid (hero + 2 side images + "+N more" overlay), opens PhotoGallery
7. **PriceHistoryChart** — Pure SVG line chart with trend indicator, gradient fill, change log
8. **RangeFilter** — Dual-thumb range slider with debounced URL navigation
9. **SplitView** — List + map side by side on desktop; map pin highlighting synced with list hover
10. **ContactReveal** — Button that calls reveal API (rate-limited), shows phone + WhatsApp deep link
11. **InquiryForm** — Form with DPDP consent microcopy
12. **ShareButton** — Native Web Share API with clipboard copy fallback
13. **ReportDialog** — Reason selection → DB insert → toast confirmation
14. **EMI/Cost Calculator** — Slider-based calculator relevant to your domain
15. **SimilarListings** — Server component: same category/city, ±50% price band, exclude self
16. **EditPreferences** — Inline frequency/notification toggle on saved searches
17. **NcrWaitlist / ComingSoon** — Capture page for cities not yet live

### SEO Requirements
- **JSON-LD structured data:** Organization, WebSite (with SearchAction), BreadcrumbList, ItemList on browse pages, Product/ListItem on detail pages
- **Canonical URLs** on every page
- **Dynamic sitemap** (`/sitemap.xml` → sub-sitemaps for listings, sellers, pages, [categories])
- **Robots.txt** with sitemap reference
- **noindex** on filter variants, search, account/admin pages
- **Meta tags:** unique title + description per page, Open Graph, Twitter cards
- **Slug history** table for 301 redirects when slugs change

### Security Requirements
- **RLS on every table** — no exceptions
- **Rate limiting** — dual-layer (IP + user) on sensitive endpoints (contact reveal, inquiries)
- **DPDP consent microcopy** at data collection points (inquiry, reveal)
- **Content policy** — anti-discrimination moderation
- **Platform disclaimers** — "not a party to transactions" on relevant pages
- **No full Aadhaar/SSN storage** — masked IDs only for KYC
- **CSP headers** in next.config
- **EXIF stripping** on uploaded images (client-side before upload)

### Platform Features
- **PWA manifest** with app icons for add-to-homescreen
- **Vercel Analytics + Speed Insights** in root layout
- **Error boundaries** (error.tsx) on key routes: detail, search, account, admin, seller
- **Loading skeletons** (loading.tsx) on key routes
- **Image blur placeholders** (shimmer SVG data URL for remote images)
- **Dark mode** via next-themes with system preference detection
- **In-memory rate limiter** (`checkRateLimit(key, { limit, windowMs })`)
- **Cron jobs** via Vercel cron: alert matcher, email drain (Resend), listing expiry

### Development Phases
Build in this order, each phase building on the last:
1. **Foundation:** Supabase setup, auth (email OTP + Google), profiles, middleware, response helpers
2. **Data layer:** Database schema, types, RLS policies, seed scripts
3. **Seller flow:** Onboarding, listing wizard, media upload, leads inbox
4. **Seeker flow:** Browse, search, detail page, favorites, compare, saved searches
5. **Admin:** Approval queues, KYC, user management, support, seeds CRUD
6. **[Domain-specific]:** [e.g., Student housing ecosystem, university pages, room types]
7. **SEO:** Sitemaps, JSON-LD, meta tags, canonical URLs, slug redirects
8. **Trust & safety:** Content policy, reports, disclaimers, rate limiting
9. **Notifications:** In-app + email outbox, alert matcher cron
10. **Polish:** Homepage stats, featured listings, similar listings, share, price history
11. **Testing:** E2E tests (Playwright), API journey tests, RLS policy tests
12. **Launch prep:** Analytics, error boundaries, PWA, performance optimization

### Design System
- **Rounded corners:** `rounded-xl` for cards, `rounded-full` for pills/badges
- **Shadows:** `shadow-card` (subtle) and `shadow-elevated` (hover/focus) custom values
- **Transitions:** `transition-smooth` utility (150ms ease), hover lifts (`hover:-translate-y-0.5`)
- **Color:** Primary green for CTAs, purpose-coded badges (green=sale, blue=rent, amber=lease)
- **Typography:** System font stack (Geist Sans), tight line heights, `text-foreground` / `text-muted-foreground` semantic colors
- **Mobile-first:** Responsive grid breakpoints (1 col → 2 col → 3 col), bottom sheet for mobile actions, sticky bottom bar for CTAs on detail page
- **Empty states:** Icon + heading + description + action button, never a blank page

### What NOT to build (defer to V2)
- Payment processing / subscriptions / billing
- In-app real-time chat
- Blog CMS (use MDX for content)
- Mobile native apps
- Advanced analytics dashboards
- Referral/affiliate programs
- Third-party messaging integrations (WhatsApp BSP)

---

Now build **[APP_NAME]** following this architecture. Start with Phase 1 (Foundation) and proceed through each phase, asking for approval before moving to the next. For every new feature, provide a brief product + technical review before implementing.
