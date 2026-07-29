# GharBazaar — Architecture

Real estate marketplace launching in **Mathura, Vrindavan and Delhi NCR**, structured to expand city-by-city across India (region → city → area hierarchy; new city = data rows, not code). Product requirements: **`docs/prd.md` (v2)** — three separated journeys (Buy / Rent / Sell) + Student Housing ecosystem. Working name: **GharBazaar** — rename by editing `package.json` and `src/lib/constants/site.ts` (Phase 3).

## 1. Stack decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router, Turbopack)** | The spec requires SSR-friendly SEO, schema.org and indexed listing pages. A Vite SPA cannot deliver this; Next.js server-renders every property page. Approved by owner over the original Vite+Express plan. |
| API layer | **Next.js Route Handlers** (`/api/v1/*`) | Replaces the separate Express app — same validation, middleware and REST semantics, one deploy, no CORS. |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion | Per spec. |
| Data fetching | Server Components for reads, TanStack Query for interactive client state | Best of both: SEO-critical reads render on the server; dashboards use Query cache. |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | Per spec — every form validated, schemas shared with API validation. |
| Database | **Supabase Postgres** (+ PostGIS, pg_trgm) | Per spec. Provisioned through the Vercel Marketplace integration. |
| Auth | **Supabase Auth** — email+password (with verification), email/phone OTP, Google OAuth | Per spec. Cookie-based SSR sessions via `@supabase/ssr`. |
| Storage | **Supabase Storage** (8 buckets, RLS-policied) | Per spec. |
| Maps | Google Maps API (Phase 7/8) | Per spec. Needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. |
| Hosting | Vercel (app + API), Supabase (DB/auth/storage) | Railway/Render no longer needed — Express was absorbed into Route Handlers. |

## 2. Folder structure (feature-based)

```
src/
  app/                      # Routes only — thin, delegate to features
    (marketing)/            # intent-chooser home (Buy|Rent|Sell), about, contact, blog, faq
    (buy)/buy/…             # BUY journey: hub + /buy/[city]/[area]/[type] browse + search
    (rent)/rent/…           # RENT journey: hub + browse + search (purpose: rent|lease)
    (rent)/student-housing/…# Student Housing hub + city pages (rent ecosystem)
    (rent)/college/[slug]   # university landing pages (inventory-gated indexing)
    (sell)/sell/…           # Seller Portal: landing + owner/agent/operator onboarding
    (listings)/property/[slug] # canonical property details (journey-styled by purpose)
    (auth)/                 # login, register, verify, forgot-password, callback
    admin/                  # super-admin panel (Phase 4)
    dealer/                 # seller dashboard — agents/owners/operators (Phase 5)
    account/                # customer panel (Phase 6)
    api/v1/                 # REST route handlers (Phase 2)
  components/
    ui/                     # shadcn/ui primitives
    layout/                 # navbar, footer, dashboard shells
    shared/                 # property cards, skeletons, empty/error states
  features/                 # domain logic, colocated by feature
    auth/ properties/ search/ sellers/ student-housing/ universities/
    leads/ chat/ reviews/ blog/ admin/ payments/ notifications/
      components/           # feature UI
      hooks/                # feature hooks (client)
      server/               # queries, actions, services (server-only)
      schemas.ts            # zod schemas (shared client/server)
  lib/
    supabase/               # client.ts (browser), server.ts (SSR), admin.ts (service role)
    seo/                    # metadata + JSON-LD builders (Phase 9)
    constants/              # site config, nav, enums-as-labels
    utils.ts
  providers/                # QueryClient, Theme, Tooltip providers
  types/                    # database.types.ts (generated), shared types
  proxy.ts                  # session refresh + auth gates (Next 16 proxy convention)
supabase/
  migrations/               # SQL migrations (source of truth for the DB)
docs/
```

**Rules:** routes stay thin; domain logic lives in `features/*`; anything importing `admin.ts` (service role) or secrets stays under `server/`; Zod schemas are the single source of validation for both RHF forms and API handlers.

## 3. Authentication architecture

**Flows**
1. **Email + password** — sign-up with email verification (Supabase confirm link → `/auth/callback`), forgot/reset password.
2. **OTP** — email magic-link/OTP out of the box; **phone OTP requires an SMS provider** (Twilio/MSG91) configured in Supabase Auth settings before enabling the UI (Phase 2 checklist).
3. **Google OAuth** — configured in Supabase dashboard (Google Cloud OAuth client ID/secret), PKCE flow through `/auth/callback`.

**Sessions** — `@supabase/ssr` stores the session in httpOnly cookies (secure, sameSite=lax). JWT auto-refresh happens in `src/proxy.ts` on every request. No tokens in localStorage.

**RBAC — three layers (defense in depth)**
| Layer | Mechanism |
|---|---|
| 1. Middleware | `/admin`, `/dealer`, `/account` require a session; unauthenticated → `/login?next=…` |
| 2. Section layouts | Server components fetch `profiles.role` and redirect on mismatch (`/admin` → `super_admin`, `/dealer` → `dealer`) |
| 3. Database (final gate) | Postgres **RLS on every table** — even a bypassed UI cannot read another user's data |

**Roles** — `super_admin`, `dealer`, `customer`. Signup metadata may only produce `dealer`/`customer` (enforced in the `handle_new_user` trigger); `super_admin` is granted manually:
```sql
update public.profiles set role = 'super_admin' where email = 'you@example.com';
```

## 4. Database design

Migration: `supabase/migrations/20260728000001_initial_schema.sql`

- **Identity**: `profiles` (1:1 with `auth.users`, auto-created by trigger), `dealers` (extension of profile), `kyc_documents`
- **Catalog**: `cities`, `areas`, `property_types`, `amenities` — admin-managed master data, seeded with real Mathura/Vrindavan/Govardhan localities
- **Listings**: `properties` (55+ columns incl. PostGIS `location`, generated `fts` tsvector, SEO fields, approval workflow, featured/premium/sponsored flags) + `property_images/videos/documents/amenities`, `nearby_places`
- **Engagement**: `favorites`, `recently_viewed`, `comparisons`, `reviews`, `property_views` counters
- **Leads**: `inquiries` (source: form/whatsapp/call/chat, pipeline status), `visit_appointments`, `conversations` + `messages` (chat)
- **Monetization**: `subscription_plans`, `subscriptions`, `payments` (gateway-agnostic: Razorpay/Stripe), `invoices`
- **Content**: `blogs` + categories + comments, `banners`, `testimonials`, `faqs`, `newsletter_subscribers`
- **Ops**: `property_reports`, `contact_messages`, `site_settings`, `activity_logs`, `audit_logs`, `notifications`

**Performance**: partial index on live listings, GIN on FTS + trigram on location names, GiST on geo, covering indexes on every dashboard query path. `nearby_properties(lat, lng, radius)` RPC for map/nearby search.

**Integrity**: FKs everywhere with deliberate cascade rules (delete seller → cascade listings; delete property → keep inquiries with `set null`), CHECK constraints on ratings/prices/counts, counter-sync triggers.

### 4.1 Schema v2 deltas (from PRD v2 — land at the start of Phase 2)

No database is provisioned yet, so these are folded into a **revised initial migration** (not stacked):

| Change | Detail |
|---|---|
| `regions` (new) | Metro groupings ("Delhi NCR", "Braj"); `cities.region_id` nullable FK. NCR = 6 member cities across 3 states |
| `dealers` → `sellers` | + `seller_type enum (owner \| agent \| builder \| property_manager)`; role enum value `dealer` → `seller`. Owners onboard lightweight, agents get KYC/plans |
| `universities` (new) | name, slug, aliases[], `institution_type (university \| college \| coaching_hub \| school)`, city FK, geo-pin + PostGIS location, SEO fields |
| `property_universities` (new) | property ↔ university links; `computed_distance_m` set by trigger from both geo-pins — never user-entered |
| `room_types` (new) | Per-bed PG/hostel inventory: sharing count, monthly rent/bed, deposit, AC, meal plan, attached bath, available beds |
| `properties` additions | `rental_kind (standard \| student)`, `gender_policy (any \| boys_only \| girls_only \| family_only)`, `preferred_tenants[]`, `available_from`, `lock_in_months`, curfew/warden/mess fields for student listings |
| Seeds | NCR region + member cities/localities; Mathura & NCR universities + coaching hubs; new property types (PG, Hostel, Shared Room, Guest House) |
| Listing lifecycle | `expires_at` enforced: 60-day auto-expiry + renewal (trust layer) |

## 5. API conventions (Phase 2)

- Base path `/api/v1`, REST, JSON envelope: `{ data, error, meta }`; `meta` carries `{ page, perPage, total }`
- Every handler: Zod-parse input → auth/role check → service call → typed response; errors as `{ error: { code, message, details? } }`
- Pagination `?page=&per_page=`, sorting `?sort=price&order=asc`, filters as documented per resource
- Rate limiting on mutation + auth endpoints; webhooks (payments) verified by signature

## 6. Storage buckets

| Bucket | Access | Content |
|---|---|---|
| `property-images` | public read, owner-folder write | compressed listing photos + thumbs |
| `property-videos` | public read, owner-folder write | uploaded walkthroughs |
| `property-documents` | private (owner + admin) | brochures, floor plans, legal docs |
| `kyc-documents` | private (owner + admin) | Aadhaar/PAN/GST/RERA |
| `avatars`, `dealer-assets`, `blog-images` | public read | profile/branding/blog media |
| `invoices` | private, service-role write | generated PDFs |

Uploads land in `{userId}/…` folders — storage RLS ties write access to the folder owner.

## 7. Planned dependencies by phase

Already installed: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `framer-motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `next-themes`, shadcn/ui set.

| Phase | Adds |
|---|---|
| 2 | `server-only`, rate limiter (Upstash via marketplace or in-DB), `supabase` CLI (dev) |
| 3 | shadcn blocks as needed, `embla-carousel-react` |
| 4–6 | `recharts` (analytics), `@tanstack/react-table` (admin tables), tiptap (blog editor) |
| 7 | `react-dropzone`, `browser-image-compression`, `react-easy-crop`, `@vis.gl/react-google-maps`, `qrcode.react` |
| 9 | none — Next.js Metadata API + JSON-LD builders in `lib/seo` |
| 11 | `vitest`, `@testing-library/react`, `playwright` |

## 8. Phase status

- [x] **Phase 1** — architecture, folder structure, dependencies, DB schema, auth design *(Supabase provisioning pending `vercel login`)*
- [x] **PRD v2** — journey separation, Student Housing, seller model, NCR region, trust layer *(superseded by blueprint)*
- [x] **Startup Blueprint v1.1** — 14 documents in `docs/blueprint/`, all FINAL after 10-dimension Founder Review + pre-build reality check. **Development gate: awaiting founder approval**
- [x] **Phase 2 backend** — REST API layer (`/api/v1/*`), service layer, Zod schemas, cron suite, middleware, health endpoint
- [x] **Phase 3 frontend core** — 13 public pages (property detail, college/university, search, sell, auth flows, seller profile, dealer directory, city student-housing), 4 shared components (ContactReveal with DPDP consent, InquiryForm, Pagination, SearchBar)
- [x] **Phase 4 admin** — approval queue (6-point checklist), KYC queue, reports queue (2h/24h SLA), seeds management (cities/areas/universities/amenities/property-types), user management (360° view, strikes, toggle-active), field CRM (Kanban pipeline), support tickets (macros, internal notes), metrics home; 19 admin API routes under `/api/v1/admin/`
- [x] **Phase 5 seller dashboard** — onboarding wizard (3-step seller setup), 5-step listing wizard with autosave, listings management (status tabs, renew), leads inbox with CSV export, KYC submission (Aadhaar disclaimer), profile edit; 10 new API routes (seller onboard/profile/kyc, property publish/images/room-types/stats, leads export, areas)
- [x] **Phase 6 customer account** — `/account` section: dashboard (upcoming visits, recently viewed), favorites (optimistic remove), compare (side-by-side table, max 4), saved searches, visits (tab filter by status), notifications (paginated, mark-all-read), profile edit; 8 new API routes under `/api/v1/me/`
- [x] **Phase 7 property module** — ImageUploader (drag-drop, compress, crop, Supabase Storage), PropertyMap + LocationPicker (Google Maps + graceful no-key fallback), PropertyQR (qrcode.react dialog), SearchMapView (price-badge markers + InfoWindow), list/map toggle on search (?view=); packages: react-dropzone, browser-image-compression, react-easy-crop, @vis.gl/react-google-maps, qrcode.react
- [x] **Phase 8 search enhancements** — autocomplete suggest API (cities/areas/universities, ilike, debounced 250ms), keyboard-navigable typeahead in SearchBar, SaveSearchButton (auth-aware dialog with name/frequency/email toggle → POST /api/v1/me/saved-searches), property type filter pills, university proximity filter + radius chips, fixed zero-results CTA; new routes: GET /api/v1/search/suggest, GET /api/v1/property-types
- [x] **Phase 9 SEO** — typed JSON-LD builders in `src/lib/seo/schema.ts` (Organization, WebSite+SearchAction, BreadcrumbList, RealEstateListing, ItemList, AggregateOffer, RealEstateAgent); robots.txt; index sitemap + segmented XML sitemaps (listings/colleges/sellers); city-level buy/[city] + rent/[city] pages (ISR 300s, static params, noindex <3 listings, BreadcrumbList + ItemList schema); root layout Organization+WebSite schema; college page + AggregateOffer (per-bed price range); seller page RealEstateAgent schema; property detail upgraded via schema builder
- [ ] 10 optimization · 11 testing · 12 deployment
