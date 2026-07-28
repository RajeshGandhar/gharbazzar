# 02 · Product Requirements Document (Blueprint edition)

Builds on PRD v2 (journeys, student housing, seller model, regions — all retained). This document adds what was **missing**, names **weaknesses**, and flags **scalability problems**. MVP-in/out is restated at the end.

## A. Missing modules found (now added)

### A1. Saved searches + instant alerts — *the retention engine* ⭐
The single biggest gap in the old plan. Property search is a 2–8 week journey; without alerts, users visit once and never return.
- Save any filter combination → alert on new matches ("3 new 2BHKs in Krishna Nagar under ₹10k"). **Channels at MVP: email + in-app** (WhatsApp alerts activate with the Business API in Wave 2 — consistency fix from Founder Review: BSP sending is out of MVP scope).
- Price-drop alerts on favorited listings.
- This also powers dealer value: "your listing was sent to 43 matched seekers."

### A2. Assisted listing (ops-powered) ⭐
A Mathura PG owner will not complete a 20-field wizard. Flow: owner sends photos + details on WhatsApp → ops team creates the listing → owner gets a magic link to claim/manage it. Admin panel needs a "create listing on behalf of" tool with attribution. This is how supply actually gets built in tier-2/3.

### A3. Contact-reveal metering
Phone numbers are masked until a seeker taps "Show number / WhatsApp" (logged as a lead event). Powers: lead counting for dealers, anti-scrape protection, future lead-package monetization, and honest analytics. Missing entirely from v1 (numbers were just… public).

### A4. Listing lifecycle engine
Draft → pending approval → live → (renew at 60d) → expired/sold/rented archive. Includes "mark as sold/rented" prompts (data goldmine for price intelligence), relist flow, and edit-triggered re-review for sensitive fields (price ±30%, location).

### A5. Locality intelligence pages
Every area gets a data page: live listing counts, price ranges (once density allows), amenities nearby, commute anchors. SEO asset + trust asset. Starts thin, grows with data.

### A6. Search analytics capture
Log every search (query, filters, result count, zero-result flag). Feeds: demand heatmaps for dealers ("42 people searched 1BHK in Vrindavan last week — you have none listed"), expansion decisions, AI training data later. Free to build now, impossible to backfill.

### A7. In-app + WhatsApp notification outbox
Unified outbox with per-channel delivery state (in-app now; WhatsApp Business API + email next). All fan-out async via queues — never inline in request handlers.

## B. Module-by-module improvements

| Module | Improvement | Why |
|---|---|---|
| Search | Map-first toggle with cluster pins; polygon "draw your area" (later) | Housing.com's only beloved feature; table stakes for NCR |
| Search | Lakh/Crore formatting everywhere (₹45 L, ₹1.2 Cr) | Nobody thinks in millions |
| Listing wizard | 4 steps max, autosave every field, resume via link; photo-first ordering | Wizard abandonment is the top supply leak |
| Leads | Dedupe by (phone × property × 7d); lead status pipeline; auto-responder ("Dealer usually replies in 2h"); response-rate tracked and **shown publicly** | Public response-rate forces dealer discipline — portals hide it |
| Chat | MVP = async messaging with notifications, not realtime infra; realtime later via Supabase Realtime | Realtime chat is a time sink with zero launch value |
| Reviews | Only lead-verified users can review a dealer; stay-verified badge for PG reviews (V1.1) | Review spam kills trust faster than no reviews |
| Compare | Cap at 4, shareable compare link | Shareability = family decision-making = organic reach |
| Dealer dashboard | "Demand near you" widget (from A6); listing quality score with concrete fix-it prompts | Turns dashboard from mirror into coach |
| Admin | Every action reason-coded + audit-logged; bulk operations; approval SLA timer | Ops discipline from day one |
| Blog | Merged into SEO content system (06) with locality/college content types | A generic blog is dead weight; a content system compounds |
| EMI calculator | Include stamp duty + registration by state (UP/DL/HR differ) | Real usefulness beats widget theater |
| Subscriptions | Grandfathering + proration rules defined before first paying customer | Retro-fixing billing is misery |

## C. Weaknesses in the current plan (named honestly)

1. **Ops capacity is the hidden dependency.** Verification, approvals, assisted listings, support — the trust promise is an *operations* promise. Blueprint 09 sizes it; if ops isn't staffed, trust claims must be softened.
2. **Phone OTP cost/abuse**: SMS OTP at scale invites pumping fraud. Mitigations: WhatsApp OTP where possible, rate limits, captcha on abuse signals. (08)
3. **Chat scope creep risk**: locked to async MVP (above).
4. **Image pipeline underspecified in v1**: uploads need server-side re-encode, EXIF-strip (privacy!), watermark option, thumbnail generation — as an async job, not in the request path. (07/08)
5. **The 12-phase plan builds all three dashboards before any listing exists.** Re-sequenced: supply tools + public search ship first, admin next, analytics last. (Reflected in build order at Phase 2 kickoff.)
6. **Legal/compliance unaddressed**: Terms, privacy (DPDP Act 2023), listing-content liability, RERA advertising rules for agents, GST invoicing. Templates before public launch — not lawyer-optional.

## D. Scalability problems & answers

| Concern | Now (MVP) | At scale |
|---|---|---|
| Search | Postgres FTS + trigram + PostGIS (fine to ~100k listings) | Typesense/Meilisearch via marketplace; same API contract |
| Images | Supabase Storage + Next/Image optimization | CDN transforms; pre-generated variants in async pipeline |
| Notifications | Outbox table + cron drain | Vercel Queues; WhatsApp BSP |
| Analytics events | Postgres append tables, monthly partitions | Tinybird/ClickHouse when query cost bites |
| Geo queries | PostGIS GiST | Unchanged — PostGIS scales further than we will |
| Traffic spikes (admission season) | ISR + CDN cache on browse/college pages | Unchanged; cache-first architecture absorbs it |

## E. MVP scope (final)

**IN:** 3 journeys · student housing ecosystem (university search, college pages, room-type inventory) · seller model with owner/agent/operator onboarding + **assisted listing** · listing lifecycle + approval + trust L0–L1 · contact-reveal metering · leads pipeline + WhatsApp CTAs · **saved searches + alerts (email/in-app)** · async chat · favorites/compare/recently viewed · verified reviews · notifications · subscriptions + Razorpay (dormant until liquidity switch) · admin panel with ops queues · SEO system + locality/college pages · search analytics capture · dark/light premium UI.

**OUT:** realtime chat, WhatsApp Business API sending (CTAs only), bookings/rent collection, builder module, services marketplace, price trends UI, Hindi UI, AI features, apps, polygon map search, call masking.

---

## F. v1.1 — Founder Review additions

### F1. Field-ops CRM-lite (new module — supply engine tooling)
The launch plan (12§1) runs on field onboarding, but no tool tracked it. Admin gets: prospect pipeline (identified → visited → onboarded → active), assignee + visit logs, daily quotas, assisted-listing attribution. Backed by `seller_onboarding` (07). Without this, the founder runs supply ops from a notebook.

### F2. User blocking (new feature — safety gap)
Either side can block the other at conversation level (harassing dealer, spam seeker). Blocks suppress chat + reveal both directions and feed risk signals (10). Was entirely missing.

### F3. Listing claim security
Assisted-listing claim links bind to the owner's phone: claiming requires OTP on the number ops recorded. Prevents listing hijack via forwarded links.

### F4. Media limits & retention
Caps: 30 photos, 2 videos, 5 documents per listing (quality floor stays ≥3 photos). Media of archived listings retained 12 months, then cold-deleted (storage cost control; forensics window preserved).

### F5. MVP acceptance criteria (measurable "done")
| Criterion | Target |
|---|---|
| Search p95 (filtered, city-scope) | < 400ms server time |
| Listing wizard completion rate (started → submitted) | > 60% (owners), > 80% (assisted) |
| Approval SLA compliance | > 90% within 4 business hours |
| Reveal → WhatsApp/call open | > 55% |
| Lighthouse (mobile, listing + browse pages) | ≥ 90 perf, 100 SEO |
| Alert delivery latency (instant tier) | < 15 min from listing approval |
| RLS coverage | 100% of tables, verified by automated policy tests (Phase 11) |

### F6. Content-language decision
UI strings externalized from day one (Hindi Y2); **listing content stays single-field** — sellers write naturally (Hinglish welcome); no dual-language content columns until Hindi UI ships. Avoids empty-translation debt.
