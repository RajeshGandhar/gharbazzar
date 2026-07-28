# 13 · Founder Review Register (v1 → v1.1)

Every blueprint document reviewed on 10 dimensions: assumptions · weaknesses · trade-offs · improvements · missing features (**F**) · missing business opportunities (**B**) · missing monetization (**M**) · missing trust features (**T**) · missing operational requirements (**O**) · future scalability (**S**). Findings below; fixes applied in each doc's **v1.1 section** (or in-place where old text was wrong). Rejections are recorded deliberately — a review that only adds is a review that didn't think.

**Cross-document defects caught (the review's best catches):**
1. **Internal contradiction:** 02 promised WhatsApp alerts while WhatsApp sending was out of MVP scope → corrected in place (email + in-app at MVP).
2. **Undefined north star:** "qualified lead" was used in 4 documents and defined in none → defined once in 12§10, inherited everywhere.
3. **Legal gap:** IT Rules 2021 grievance-officer obligations for intermediaries were absent → added to 10 (this is statutory, not stylistic).
4. **Phantom tooling:** the growth plan ran on field operations no tool tracked → field CRM-lite added across 02/07/09.
5. **Phantom heartbeat:** alerts, expiry, renewals, digests all imply scheduled jobs — none were specified → cron inventory added to 08.
6. **Missing safety primitive:** no user-blocking anywhere → added 02/10.
7. **Unpinned region:** Supabase region never chosen → `ap-south-1` (Mumbai) pinned in 07 (irreversible-ish; DPDP + latency).

---

## 01 Vision — FINAL
- **Assumptions:** field CAC ₹300–800/dealer (unvalidated); one season suffices for PG corridor coverage; tier-3 SEO winnable in 6–9 months; NCR student clusters behave like Mathura; ~200 active dealers in Mathura (validate against association rolls).
- **Weaknesses found:** no market sizing (B); no risk register (O); no copycat defense (S); metrics without time horizons; "why now" absent (B); north star undefined; SEO-dependency risk unnamed (S).
- **Trade-offs accepted:** depth-over-breadth (slower topline, defensible density); ops-cost trust model vs listing-count vanity growth.
- **Applied (10):** why-now (Jewar/Yamuna corridor, NEP enrollment, UPI/WhatsApp rails, incumbent trust rot) · TAM/SAM/SOM flagged as directional · moat/copycat-defense section · 6-item risk register with mitigations · metric horizons (T+3/6/9/12) · brand-search KPI · north-star definition delegated to 12§10 · incumbent-response scenario link · key-person risk named · funding narrative traction-proof tightened.
- **Rejected:** pan-India TAM-first storytelling (vanity before Mathura proof); exit-strategy section (premature, signals wrong intent).

## 02 PRD — FINAL
- **Assumptions:** owners will claim assisted listings when leads arrive; 60-day expiry is the right freshness/annoyance balance; sellers tolerate reveal-gating of their own numbers (they gain lead counts).
- **Weaknesses found:** WhatsApp-alert contradiction (fixed in place); no acceptance criteria; field CRM missing (O); user blocking missing (T/F); claim-link hijack risk (T); media costs unbounded (S); content-language ambiguity (F).
- **Trade-offs accepted:** reveal friction vs lead quality (measured, reversible); wide listings table vs flexibility (07§5); async chat vs realtime (launch value).
- **Applied (10):** alert-channel fix · field CRM-lite module · user blocking · OTP-bound claim links · media caps + retention · measurable acceptance criteria table (search p95, wizard completion, SLA, Lighthouse, alert latency, RLS test coverage) · single-language content decision · post-reveal follow-through loop (in 04§15) · seller-directory feature (via 06) · lead-export for dealers (via 08).
- **Rejected:** dual-language content columns now (empty-translation debt); realtime chat reconsideration (stands rejected).

## 03 User Journeys — FINAL
- **Assumptions:** parents decide student housing; admission trips compress visits into 1–2 days; dealers won't change workflow (leads must reach WhatsApp).
- **Weaknesses found:** the *retention* journey (returning seeker) missing — the highest-frequency journey wasn't documented (F); field ops agent journey missing (O); rejection/appeal loop undefined (T); no activation metrics (O).
- **Applied (8):** returning-seeker journey with alert-fatigue mitigations · field-ops-agent journey with offline tolerance · seller rejection/appeal loop (two rejections → human help, not a third form) · per-persona activation metrics table · property-manager journey (added earlier in review cycle) · alert-CTR/D30 KPIs · dedupe-by-phone in prospect pipeline · visit-route planning noted for students (multi-visit day).
- **Rejected:** separate NRI-buyer journey doc now (roadmap persona; one line in 05 Wave 3 suffices).

## 04 UX Blueprint — FINAL
- **Assumptions:** glassmorphism can coexist with AA contrast and low-end perf (token floors + blur budget enforce it); users accept OTP-only auth.
- **Weaknesses found:** principles without a screen inventory (O); no first-run/empty dashboard design (F); no flaky-network behavior spec (F/S — this market is 4G-on-a-good-day); microcopy language undecided; a11y under-specified; push-permission stance unstated (T).
- **Trade-offs accepted:** premium motion vs data budget (reduced-motion + lazy media); one-primary-action-per-screen discipline vs feature visibility.
- **Applied (10):** 26-screen inventory with primary actions · seller first-run states · autosave/retry + resumable uploads + optimistic-UI rules · Hinglish-tolerant microcopy decision · 44px targets + aria-described errors + focus discipline · no-browser-push stance · post-reveal follow-through loop · offline banner with queued-count · CLS-owned skeleton rule · "needs a reason to exist" screen governance.
- **Rejected:** exit-intent popups (anti-pattern we banned ourselves); browser push notifications (trust-negative).

## 05 Business — FINAL
- **Assumptions (now explicit):** ~200 active dealers, 20% paid conversion, ≤8%/mo churn, ₹1,800 blended ARPU, 60 Pro operators — all flagged as hypotheses with a validation plan.
- **Weaknesses found:** no burn/runway (O); no LTV:CAC (B); GST/dunning/refunds absent (O); price points untested (B); no incumbent-response plan; several revenue lines missed (M).
- **Trade-offs accepted:** delayed monetization (burn now, durable liquidity later); seekers-never-pay (forgoes NoBroker-style revenue for positioning + supply access).
- **Applied (10):** burn table + ₹12–15L runway-to-revenue figure · LTV:CAC ≈ 20:1 with churn sensitivity · owner "Sell Faster" bundle ₹999 · à-la-carte featured slots · tenant-verification reports (operator-pays, Wave 2) · labeled college-page education sponsorships · data/API products (Wave 3) · GST 18% + GSTIN invoicing note · dunning ladder (retry → WhatsApp/call → grace → downgrade-never-delete) · refund matrix + price-validation plan (n=20 interviews, offer A/B, boost price test).
- **Rejected:** charging seekers in any form (invariant); ad-network revenue (CWV + premium positioning); discount war response (accelerate value instead).

## 06 SEO — FINAL
- **Assumptions:** inventory-gated pages avoid thin-content penalties; tier-3 SERPs stay low-competition for 12+ months; guides earn links organically.
- **Weaknesses found:** sold-listing 410-immediately wasted equity + stray demand (fixed in place: live-unavailable 90d → 410) (S); seller-directory pages missed — SEO *and* dealer-acquisition loop (B); content ops unowned (O); canonical-host undecided; measurement cadence absent (O); PG per-bed offer markup missed (F).
- **Trade-offs accepted:** noindex empty pages vs early "coverage" (long-term crawl trust wins); no link buying (slower, safer for a trust brand).
- **Applied (10):** sold-listing lifecycle policy · `/property-dealers/{city}` directory pages (index at ≥5 verified) · content ops workflow (owner, template, ₹1–2k/guide, season calendar) · canonical host rules (apex, https, no trailing slash, lowercase) · internal-search noindex · sitemap ping + IndexNow · weekly GSC cadence + 100-term position tracking · brand-search-as-trust-KPI · `AggregateOffer` markup on PG/college pages · GBP-for-operators cross-link.
- **Rejected:** programmatic pages ahead of supply in expansion cities (the incumbent mistake we're exploiting); AI-spun locality text (data-dense templates only).

## 07 Database — FINAL
- **Assumptions:** Postgres carries us to 100k listings / 10M events before any new infra; counters-as-caches acceptable with events as truth.
- **Weaknesses found:** `webhook_events` referenced by 08 but never specified (O); field CRM table missing (O); retention policies unstated (O/S — DPDP needs them); region unpinned (S/T); session identity undefined for events (F); NCR locality-seeding strategy absent (O); backups untested-by-default (O).
- **Trade-offs accepted:** wide `properties` vs EAV (indexed filters win); arrays for filter-only facts vs join purity; archive-not-delete (storage cost for forensic + SEO value).
- **Applied (9):** `webhook_events` · `seller_onboarding` · Mumbai region pinned · retention/archival policy table (events 24mo→rollups, audit 5y, KYC 90d, media 12mo) · anon-session UUID strategy with sign-in merge · student partial index · NCR top-50-localities seeding + zero-result mining loop · quarterly restore drill · rollup tables named (`locality_stats_daily`).
- **Rejected:** sharding/multi-region design now (S — YAGNI below millions); UUID→bigint listing IDs migration (churn without user value).

## 08 API — FINAL
- **Assumptions:** first-party-only clients at MVP (no CORS); Postgres rate limiting adequate pre-scale.
- **Weaknesses found:** **no scheduled-jobs inventory** — alerts/expiry/renewals had no execution vehicle (O, the doc's biggest hole); no observability section (O); no health endpoint (O); no deprecation policy (S); admin bulk + lead export missing (F); future-apps auth path unstated (S).
- **Trade-offs accepted:** REST + service layer vs tRPC/actions-only (future apps + OpenAPI requirement); cursor pagination on feeds vs total counts (stability wins).
- **Applied (9):** 8-job cron inventory with idempotency + run logs · observability via marketplace integration + structured logs + alert thresholds · `/health` with queue-lag signals · 6-month deprecation policy with headers · bulk admin ops · leads CSV export · webhook ledger cross-ref · mobile-token auth path note · server-actions boundary policy (no business logic outside the service layer).
- **Rejected:** GraphQL (no client diversity to justify it); API keys/public API at MVP (scraper gift).

## 09 Admin Operations — FINAL
- **Assumptions:** founder + 3 can run launch ops; approval ≈ 2–3 min/listing with the checklist.
- **Weaknesses found:** staffing math absent — SLAs were vibes (O); field CRM untooled (O); refund workflow undefined (O); reviewer drift unguarded (T); seller education missing (B — deflection + quality); support hours unpublished; incident basics absent (O); SOPs unversioned (O).
- **Applied (8):** field CRM-lite spec with quotas + per-agent pass-rate · staffing math incl. 3–5× season surge plan with temp reviewer · weekly 10-item consistency audit · refund/dispute workflow with 4h first-touch · seller education program (broadcast tips + onboarding calls) · published support hours (9–21 IST) · incident basics + public-banner toggle + post-incident notes · SOPs in repo (`docs/ops/`) with new-hire 100%-audit first week.
- **Rejected:** dual-control admin approvals at this scale (audit + weekly review suffices; revisit at multi-admin).

## 10 Trust & Safety — FINAL
- **Assumptions:** L2 physical verification is economically coverable by ₹499 fee at batch density; sellers accept reveal-gating.
- **Weaknesses found:** **IT Rules 2021 grievance-officer duty missing (statutory)** (T/O); no appeals process (T — fairness + legal); user blocking absent (T); female-seeker privacy defaults unspecified (T); verification capacity unmodeled (O); incident runbook absent (O); field-staff safety unaddressed (O — duty of care).
- **Trade-offs accepted:** verification friction vs supply growth (ladder design: L0 free to list, trust monetized above); human-confirmed enforcement vs automation speed (wrongful bans cost more than slow ones).
- **Applied (8):** grievance officer + statutory windows · 7-day appeals with audit trail · bidirectional blocking + harassment fast-lane · female-seeker privacy defaults (no photo/full name pre-reveal) · capacity math (8–10 visits/agent/day; girls'-PG priority free) · SEV-graded incident runbook with DPDP 72h check · honeypots deferred behind legal review · field-staff location-share + two-person rule.
- **Rejected:** public risk scores (gaming + defamation exposure — internal only, permanently).

## 11 AI Roadmap — FINAL
- **Assumptions:** pgvector + HNSW adequate for corpus scale; small models handle filter extraction.
- **Weaknesses found:** eval discipline hand-waved (O); no budget caps (O); privacy rules unstated (T); Hindi translation missed (F/B); image-embedding dedup synergy unexploited (T).
- **Applied (6):** golden-set + pre-committed pass-bars + one-toggle rollback · ₹3–5k/feature/mo caps with hard stops · no-PII-to-providers rule + gateway ZDR · Hinglish/Hindi auto-translation (Phase B) · embedding-based dedup feeding merge queue · parse-success as a dashboard metric.
- **Rejected (recorded in doc):** MVP chatbot (nothing to RAG); auto-published AI descriptions; AI-set pricing (advisory forever).

## 12 Growth — FINAL
- **Assumptions:** ambassadors convert at ≤₹80/signup; association goodwill purchasable via presence; CPLs hold at tier-3 rates.
- **Weaknesses found:** no budget (O); "qualified lead" undefined despite being the north-star unit (O — worst metric bug in the blueprint); no pre-committed failure responses (O); GBP local-pack play missed (B); owned demand-side audience missing (B); referral gaming unguarded (T); editorial calendar unlinked (O).
- **Trade-offs accepted:** season-timed launch vs launch-when-ready (demand physics win); expansion-as-reward discipline vs opportunistic city adds.
- **Applied (8):** qualified-lead definition (reveal/inquiry + valid phone + 48h response, 7-day dedupe) · budget with channel CAC targets + 2×-over-4-weeks kill rule · 5 pre-committed risk scenarios (incl. "founder runs routes for 30 days" hiring-failure clause) · GBP-for-operators · WhatsApp broadcast channel · referral integrity rules (pay on verified lease / 3rd live listing) · editorial-calendar season map · budget one-offs (legal/brand ₹2–3L).
- **Rejected:** paid app-install campaigns (no app); influencer spend beyond local micro-creators (CAC discipline).

---

**Status: all 13 documents FINAL (v1.1).** Development remains gated on founder approval of the blueprint + the five strategic calls (00-index).
