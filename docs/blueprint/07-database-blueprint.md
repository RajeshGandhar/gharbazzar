# 07 · Database Blueprint

Honest review of `supabase/migrations/20260728000001_initial_schema.sql` + PRD-v2 deltas. Verdicts: **keep**, **change**, **missing**. All changes land in the revised initial migration (no DB provisioned yet — we amend, not stack).

## 1. What the v1 schema got right (keep)
RLS on every table with `(select auth.uid())` initplan pattern · PostGIS generated `location` + GiST · generated `fts` + GIN · deliberate cascade rules · counter-sync triggers · storage buckets with owner-folder policies · enum discipline · partial index on live listings.

## 2. Changes to existing design

| Item | Change | Reason |
|---|---|---|
| `dealers` | → **`sellers`** with `seller_type enum (owner, agent, builder, property_manager)`; role enum `dealer`→`seller` | Four seller personas (founder-confirmed); owners/PMs were unrepresentable |
| `profiles.phone` | `unique` (nullable), normalized E.164; add `phone_verified_at` | Phone is the identity spine in India; duplicate phones = fraud vector |
| `profiles.email` | `citext` | Case-insensitive uniqueness |
| `properties` | + `rental_kind`, `gender_policy`, `preferred_tenants text[]`, `available_from`, `lock_in_months`, student facts (curfew, warden, mess type), `quality_score smallint`, `risk_score smallint`, `deleted_at` | PRD v2 + T&S blueprint |
| Deletion policy | Listings are **archived, never hard-deleted** (`deleted_at` + status); RLS filters them out; hard delete = admin-only, audit-logged | Price history, fraud forensics, 410 handling all need the row |
| `reviews` | + `lead_id` FK nullable — reviews attach to a real interaction | Review-spam defense (only lead-verified users review) |
| `inquiries` | + unique partial index `(phone, property_id)` where `created_at > now()-7d`? → implemented as app-level dedupe + supporting index `(property_id, phone, created_at)` | Lead dedupe (dealers hate duplicates) |
| `subscription_plans` | + `plan_type (subscription, one_time)`, + `audience (agent, owner, operator)` | Boosts and Student Pro live in one pricing system |
| Counters on `properties` | keep, but they become derived caches of the events table (below) — never the source of truth | Analytics integrity |

## 3. Missing tables (found in this review — now specified)

| Table | Purpose | Key columns |
|---|---|---|
| `regions` | Metro groupings (Delhi NCR, Braj) | name, slug; `cities.region_id` FK |
| `universities` | Institution master | name, slug, aliases[], `institution_type (university, college, coaching_hub, school)`, city FK, geo + PostGIS location, logo, SEO fields |
| `property_universities` | Listing↔institution | PK(property, university), `computed_distance_m` (trigger from both geo-pins — **never user input**) |
| `room_types` | Per-bed PG/hostel inventory | property FK, sharing_count, monthly_rent_per_bed, deposit, is_ac, meal_plan, attached_bath, total_beds, available_beds, is_active |
| `saved_searches` | Retention engine | user FK, name, journey, filters jsonb, alert_channel (none/in_app/email/whatsapp), frequency (instant/daily), last_alerted_at |
| `listing_events` | Unified analytics spine | property FK, user nullable, session_id, `event_type (view, gallery_open, reveal, whatsapp_click, call_click, share, favorite)`, source page, created_at — **BRIN index, monthly partitions at scale** |
| `contact_reveals` | Reveal metering (subset view of events with guarantees) | user, property, seller, revealed_at; unique(user, property) |
| `search_events` | Demand analytics | filters jsonb, city/area, result_count, zero_results bool, session |
| `price_history` | Trigger-written on price change | property FK, old/new price, changed_at — powers drop-alerts + trends |
| `property_slugs` | Slug history → 301s | old_slug unique, property FK |
| `notification_outbox` | Async delivery with per-channel state | user, channel (in_app/email/whatsapp/sms), payload, status, attempts, next_retry_at |
| `media_jobs` | Async image/video pipeline | storage path, `job (thumbnail, compress, exif_strip, watermark)`, status, error |
| `verification_requests` | T&S workflow | subject (listing/seller), level requested, evidence paths, status, reviewer, reason codes |
| `support_tickets` (+`ticket_messages`) | L1 support inbox | requester, channel, category, priority, status, assignee, SLA timestamps |
| `strikes` | Enforcement ledger | user FK, reason code, evidence, expires_at |
| `blocked_identifiers` | Phone/device/IP blacklist | kind, value_hash, reason, expires |
| `referrals` | Growth loop | referrer, referee, reward state |

## 4. Index review (additions)
- `properties (city_id, purpose, property_type_id, price)` — the money query.
- `properties (approval_status, status, published_at desc)` — approval queue + freshness feeds.
- `property_universities (university_id, computed_distance_m)` — college pages.
- `room_types (property_id) where is_active` · `saved_searches (user_id)` + GIN on filters jsonb (matcher) · `price_history (property_id, changed_at desc)` · outbox `(status, next_retry_at)` partial where pending · events tables BRIN on `created_at` · `property_slugs (old_slug)` unique.
- Drop nothing from v1; audit `idx_properties_beds_baths` after real query stats (likely absorbed by the money index).

## 5. Normalization judgment calls (deliberate, documented)
- `properties` stays wide (55+ cols): read-optimized for the hottest entity; EAV/jsonb would wreck filter indexes and type safety. Correct call.
- `preferred_tenants`/`tags` as arrays: filter-only, never joined — arrays + GIN beat join tables here.
- `comparisons.property_ids uuid[]`: session-ish data, fine.
- Amenities as join table (not array): admin-managed with icons/labels — relational is right.
- jsonb only where schema is genuinely open (`filters`, `payload`, `meta`) — never for queryable listing facts.

## 6. Scale plan
| Horizon | Action |
|---|---|
| MVP → 100k listings | Nothing. Postgres + indexes above are comfortable |
| Events > 10M rows | Monthly partitioning (`listing_events`, `search_events`, logs); BRIN already in place |
| Search latency pain | Typesense/Meilisearch read replica of live listings via marketplace; write path unchanged |
| Connection pressure | Supavisor transaction pooling (Supabase default); serverless-safe |
| Heavy analytics | Nightly rollup tables (`locality_stats_daily`) feeding dashboards + price intelligence; raw events eventually to ClickHouse/Tinybird |
| DR | PITR enabled at provisioning; migration files in repo = schema source of truth |

## 7. RLS additions for new tables
Same patterns as v1: own-rows for `saved_searches`/`contact_reveals`/`referrals`/`support_tickets(requester)`; admin-only for T&S/ops tables; `room_types` inherit property visibility (public read via parent, seller-write via parent ownership); events insert via service role only (API-mediated), select admin + own-seller aggregates through views.

---

## 8. v1.1 — Founder Review additions

**Two more missing tables:**
| Table | Purpose |
|---|---|
| `webhook_events` | Gateway event idempotency ledger (provider, event_id unique, processed_at, payload) — 08 referenced it; it must exist here |
| `seller_onboarding` | Field CRM-lite pipeline: prospect identity, stage (identified→visited→onboarded→active), assignee, visit notes, next_action_at — powers 02§F1 / 09 v1.1 |

**Provisioning requirement:** Supabase project region **`ap-south-1` (Mumbai)** — latency for Indian users + DPDP data-residency posture. Set at provisioning; painful to change later.

**Data retention & archival policy (was unstated):**
| Data | Policy |
|---|---|
| `listing_events`, `search_events` | 24 months hot → nightly rollups (`locality_stats_daily`) persist forever → raw pruned |
| `activity_logs` / `audit_logs` | 12 months / 5 years (audit is the legal trail) |
| Archived-listing media | 12 months then cold-delete (02§F4) |
| KYC documents | 90 days post account-closure/rejection (10§7) |
| OTP/verification codes | Supabase-managed, ephemeral |

**Additional decisions:** `session_id` = anonymous UUID cookie (30-day rolling) for pre-auth event stitching, merged into user on sign-in · partial index `properties (city_id, purpose) where rental_kind = 'student'` for student-hub queries · NCR locality seeding = top-50 localities per member city at launch, expanded via zero-result search mining (`search_events`) + admin adds — never bulk-import 3,000 junk localities · backup posture: PITR on from day one, quarterly restore drill to a scratch project (a backup untested is a hope, not a backup).
