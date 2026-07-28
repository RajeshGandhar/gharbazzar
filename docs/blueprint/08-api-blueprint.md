# 08 · API Blueprint

REST under `/api/v1` (Next.js Route Handlers). SEO-critical reads go direct via Server Components; the API serves interactive clients, dashboards, and future mobile apps — same service layer underneath (`features/*/server`), so there is exactly one implementation of every business rule.

## 1. Standards (apply to every endpoint — no exceptions)
- **Envelope:** `{ data, error: { code, message, details? } | null, meta? }`; `meta` = `{ page|cursor, perPage, total? }`.
- **Validation:** Zod-parse *everything* (body, query, params) with schemas shared with the forms; unknown keys stripped; 422 on failure with field-level details.
- **AuthZ:** per-route role matrix (below) + RLS as the unbypassable backstop + service-role calls only inside `server/` modules with explicit authorization checks above them.
- **Pagination:** cursor-based (`?cursor=&limit=`) for consumer feeds (stable under inserts); offset for admin tables (needs totals). Limit caps: 50 consumer / 100 admin.
- **Errors:** stable code strings (`AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `CONFLICT`, `PAYMENT_FAILED`). Never leak internals.
- **Idempotency:** `Idempotency-Key` header honored on payment/order creation (stored 24h).
- **Docs:** OpenAPI generated from the Zod schemas (`zod-openapi`) served at `/api/v1/docs` — the spec's Swagger requirement, without hand-written drift.

## 2. Rate limit classes
| Class | Limit (per IP + per user) | Applies to |
|---|---|---|
| auth | 5/min, 20/day per identifier | OTP send, login, register |
| reveal | 20/day per user (anti-scrape) | contact reveals |
| write | 20/min | listings, leads, chat, reviews |
| search | 60/min | search, suggest |
| read | 120/min | everything else |
Backed by Postgres token bucket at MVP (single dependency), swappable to Upstash via marketplace when hot. 429 + `Retry-After`.

## 3. Endpoint inventory

**Auth & profile** — `POST /auth/register` (role-safe metadata), `/auth/otp/send|verify`, `/auth/login`, `/auth/logout`, `GET /auth/callback` (OAuth/PKCE), `GET|PATCH /me`, `POST /me/avatar` (signed upload).

**Sellers** — `POST /sellers` (onboard w/ type), `GET|PATCH /sellers/me`, `POST /sellers/me/kyc` (doc upload → verification_request), `GET /sellers/{slug}` (public profile), `GET /sellers/me/analytics` (views/leads/quality score), `GET /sellers/me/demand` (search-demand widget).

**Listings** — `POST /listings` (draft), `PATCH /listings/{id}`, `POST /listings/{id}/publish` (validates completeness → approval queue), `POST /listings/{id}/renew`, `POST /listings/{id}/status` (sold/rented/inactive), `DELETE` (archive), `GET /listings/mine`, `POST /listings/{id}/media` → **signed upload URL flow**: client uploads to Storage directly, then `POST /media/complete` registers + enqueues `media_jobs` (re-encode, EXIF-strip, thumbnails). `PUT /listings/{id}/room-types` (bulk upsert), `GET /listings/{id}/universities/suggest` (PostGIS ≤10km), `PUT /listings/{id}/universities`.

**Search & browse** — `GET /search` (journey-scoped filters incl. university+radius, gender, per-bed budget; cursor; `X-Total-Estimate`), `GET /search/suggest` (localities/colleges/landmarks, trigram), `GET /universities`, `GET /universities/{slug}/nearby` (typed inventory), master data `GET /cities|areas|property-types|amenities|plans` (cached hard).

**Engagement** — `POST /listings/{id}/reveal` (auth-gated, metered → returns contact + logs lead-intent), `POST /listings/{id}/inquiries`, `POST /listings/{id}/visits` + `PATCH /visits/{id}`, favorites CRUD, `GET/PUT /compare`, saved searches CRUD + `POST /saved-searches/{id}/test`, `POST /listings/{id}/report`, reviews CRUD (lead-verified), `GET /notifications` + `POST /notifications/read`.

**Chat** — `POST /conversations` (customer-initiated, per listing), `GET /conversations`, `GET|POST /conversations/{id}/messages` (cursor), read receipts via `POST /messages/read`.

**Billing** — `GET /plans`, `POST /orders` (plan/boost; idempotent), `POST /webhooks/razorpay` (signature-verified, event-sourced), `GET /invoices`, `GET /subscriptions/me`.

**Admin (`/admin/*`, super_admin-only namespace)** — approval queue `GET /admin/queue/listings` + `POST .../approve|reject` (reason codes), re-review diffs, KYC queue, verification requests, reports queue, users search + strikes + blocks, **assisted listing** (`POST /admin/listings?on_behalf_of=`), seeds CRUD (cities/areas/universities/types/amenities), plans/banners/testimonials/faqs/settings, blogs CRUD, support tickets + messages, metrics endpoints, audit log search, duplicate-merge tool.

**Public content** — blogs/guides list+detail, FAQs, banners by slot, `GET /sitemaps/*` feeds, `POST /newsletter`, `POST /contact`.

## 4. Security review
- **Uploads:** signed-URL only (no proxied bodies), magic-byte sniff server-side on `media/complete`, size caps by type, always re-encode (kills polyglot payloads), **EXIF GPS stripped** (owner privacy), per-user daily quotas.
- **CSRF:** SameSite=Lax cookies + Origin/Sec-Fetch-Site checks on mutations (first-party only, no CORS opened).
- **Scraping:** reveal metering + rate classes + phone numbers never in HTML/JSON until reveal; honeypot listings (T&S) later.
- **OTP abuse:** per-identifier daily caps, IP velocity, captcha escalation on breach; WhatsApp-OTP preferred over SMS where available (cost + pumping fraud).
- **Webhooks:** signature verify + timestamp tolerance + event idempotency table.
- **Headers:** CSP (nonce-based, no third-party scripts), HSTS, X-Content-Type-Options, Referrer-Policy — set in `vercel.ts`/next config at Phase 2.
- **Secrets:** service-role key server-only; anon key public by design; RLS assumed hostile-client at all times.
- **Chat safety:** server-side keyword screen (payment-solicitation patterns) → flag to T&S, warn user inline.

## 5. Caching
| Surface | Strategy |
|---|---|
| Master data (cities/types/amenities/plans) | Runtime cache 1h + tag invalidation on admin write |
| Browse/college/locality pages | ISR with tags: `listing:{id}`, `area:{id}`, `college:{id}` — revalidated on approve/edit/expire |
| Listing detail | ISR + tag revalidate on edit/status change; 410 + suggestions after archive |
| Search API | `no-store` (personal/volatile) at MVP; hot-combo CDN micro-cache (30s) if needed later |
| Seller analytics | Runtime cache 5m per seller |
| Events/reveals | Never cached |

## 6. v1.1 — Founder Review additions

### Scheduled jobs inventory (was missing entirely — the platform has a heartbeat)
| Job | Schedule | Action |
|---|---|---|
| Listing expiry sweep | daily 02:00 IST | expire past `expires_at`, notify seller, update sitemaps/tags |
| Renewal nudges | daily | T-7 and T-1 before expiry → outbox |
| Saved-search matcher | every 15 min | new approved listings × alert filters → outbox (meets 02§F5 latency target) |
| Outbox drain/retry | every 5 min | deliver pending, backoff failures |
| Quality-score recompute | on change + nightly full | freshness decay component |
| Season campaigns | cron per calendar | operator bed-update prompts, student season notices |
| Rollups | nightly | `locality_stats_daily`, seller analytics aggregates |
| Sitemap regeneration | hourly incremental | lastmod feeds |
Vercel Crons hitting authenticated internal routes; every job idempotent + run-logged.

### Observability (was missing)
Error tracking via marketplace `observability` integration + structured request logs (route, status, duration, user-hash) + `GET /api/v1/health` (DB reachability, queue depth, oldest-pending-outbox age) wired to an uptime monitor (marketplace `monitoring`). Alert thresholds: 5xx rate, outbox lag > 30 min, approval queue age > SLA.

### Additions to inventory
Admin bulk ops (`POST /admin/queue/listings/bulk`) · seller lead export (`GET /leads/export.csv` — dealer retention feature) · `webhook_events` ledger backing all webhook handlers (07§8).

### Policies
**Deprecation:** versioned paths; breaking change ⇒ `/v2` + 6-month v1 sunset with `Deprecation` headers — cheap discipline now, priceless when mobile apps exist. **Future apps:** same service layer; mobile clients use Supabase native token auth instead of cookies — no API redesign required. **REST-vs-server-actions:** Server Actions allowed for simple first-party form mutations, but anything a dashboard, cron, or future app touches lives in `/api/v1` — one business-rule implementation either way (service layer), no logic in route files.
