# 14 · Pre-Build Reality Check

**2026-07-28 · Audit only — no blueprint documents modified. Ten perspectives: CEO, CTO, CPO, Sales, Support, Broker, Owner, Student, Investor, QA.**

---

## Verdict: **GO — with conditions**

Technical architecture: **GO** (no blocker found; the stack, schema and API design are sound and appropriately sized).
Business readiness: **conditional** — four blockers below are *not code* and gate **launch**, not development. Backend development can start in parallel with resolving them.

### Critical blockers (must resolve; none require code)
| # | Blocker | Why it blocks | Action |
|---|---|---|---|
| B1 | **Brand name + domain + trademark unverified.** "GharBazaar" is a placeholder no one has cleared; similar marks/domains likely exist | Every public artifact (domain, OG images, GBP, collateral, DLT sender ID) depends on it; renaming after launch burns SEO + trust | Trademark search (Class 36/35) + domain acquisition **before any public surface**; code keeps the name in one constant, so dev is not blocked |
| B2 | **No legal entity.** | Razorpay onboarding, GST registration, SMS DLT registration, employment of field staff, T&C counterparty, grievance-officer designation all require it | Incorporate (Pvt Ltd or LLP) — start now; multi-week process |
| B3 | **SMS is regulated in India (TRAI DLT).** Phone OTP + any SMS require DLT registration (entity + sender ID + template approval; weeks) | The auth spec promised phone OTP; without DLT there is no SMS channel | Decision D9: launch email-OTP + Google, add phone OTP when DLT clears (recommended), or wait for DLT |
| B4 | **Launch calendar vs reality.** Today is late July 2026; the April–July student season is 9 months away; nothing reconciled these | "Launch at season" was a principle without a date | Adopt sequenced plan: build now → **soft-launch Mathura rent/buy autumn 2026** → warm-up on January 2027 intake → **full student blitz April–July 2027**. Soft launch de-risks everything with real users before the season that matters |

*(Standing technical blocker: `vercel login` still pending — Supabase cannot be provisioned until then.)*

---

## 1. Missing from MVP (critical adds — small, none architectural)
1. **Account recovery** — OTP-only auth with a lost phone/email = locked out. Email+phone both on file; recovery via the other channel; support-assisted fallback with ID check.
2. **Consent microcopy at inquiry/reveal** — seeker's number goes to the seller: DPDP requires informed consent at the moment of sharing ("Your number will be shared with {seller}").
3. **Platform-role disclaimers** — "GharBazaar is a discovery platform, not a party to any transaction; never pay deposits before visiting" on reveal, inquiry, and listing pages. Legal shield + scam defense.
4. **Anti-discrimination content policy** — listings excluding by caste/religion are prohibited (lawful tenant preferences like family/bachelor/gender stay). Moderation reason code + policy text. India-specific press/trust landmine the blueprint missed.
5. **Aadhaar handling rule** — never store full Aadhaar numbers; accept masked copies or alternate govt ID. Removes our most toxic data liability.
6. **NCR general-demand waitlist** — searches for non-student NCR inventory get a "coming soon + create alert" capture page: demand data for the Stage-4 decision, costs one page.
7. **Listing preview step** — wizard shows the listing as seekers will see it before submit (conversion + quality; reduces rejections).
8. **Unit normalization** — plots quoted in **gaj** in Braj: store sqft canonically, display gaj/sqft by type. Without this, plot data is garbage on day one.
9. **Transactional email provider** — alerts/OTP/notices assume email; no provider was ever chosen. Provision via marketplace (`messaging` category) at Phase 2.
10. **Dev/staging strategy** — local Supabase CLI for dev + single cloud project for prod, seeded staging data script. Never test against prod.

## 2. Over-engineered for launch → postpone (the honest cut list)
| Cut | Rationale | Returns in |
|---|---|---|
| **Payments, subscriptions UI, invoices, boosts** | Everything is free until liquidity gates (~month 6+); building billing now = building under zero feedback. Schema ships; integration waits | V2 (pre-revenue-switch) |
| **In-app chat** | WhatsApp is the market's OS; chat adds moderation surface + notification complexity for a channel dealers won't open | V2 |
| **Blog CMS (editor, comments, categories admin)** | Founder-written guides ship as MDX in the repo — full SEO value, zero CMS build | V2 |
| **Banners/ads + testimonials admin** | No advertisers and no testimonials exist at launch | V2 |
| **Media job-queue pipeline** | MVP: client-side compression + EXIF-strip and thumbnail on upload completion; full async pipeline later | V2 |
| **Server-side compare** | Keep compare as client-side/localStorage (students love it, costs ~nothing); persistence later | V2 |
| **QR codes, stamp-duty estimator, virtual-tour player** | EMI calc stays; tour stays a URL field | V2/V3 |
| **Referral program build** | Growth mechanism for post-liquidity; tables can wait too | V2 |
| **WhatsApp Business API (sending)** | CTAs + WhatsApp support app suffice; BSP costs + approval overhead later | V2 |

## 3. Risk registers by lens (what we hadn't thought about)
- **Legal/compliance (India):** DLT (B3) · anti-discrimination policy (§1.4) · Aadhaar (§1.5) · RERA display: agent listings of new projects must show project RERA reg no — add display field rule · grievance officer must be a *named person* with entity address (B2 dependency) · TDS 194-O only becomes relevant when we facilitate transactions (V3 bookings) — flagged for then, not now.
- **Operational:** founder bandwidth is the true bottleneck (sales+approvals+audits+appeals all founder-routed at launch — the cut list above is also a founder-time rescue) · hiring/training 2 field ops precedes supply targets · girls'-PG L2 verification must complete *before* season marketing uses it · WhatsApp support number must belong to the entity, not a personal SIM.
- **Scalability:** nothing technical threatens MVP scale; the real scale cliff is **verification ops during season surge** (already modeled 09) and **Maps API cost** if interactive maps render by default (static-first rule already set).
- **Support:** predicted top drivers: "why rejected" (mitigated: reason codes), "how do I edit", "lead didn't respond" (mitigated: response-rate nudges), account recovery (§1.1 — was missing). Support tooling MVP = queues + macros, nothing more.
- **Data quality:** locality free-text vs master list (wizard forces area select + "request new area") · geo-pin wrong (centroid distance check at approval — exists) · NCR locality seeding accuracy is an ops task with a named owner, or college-distance search is garbage · university coordinates must be verified by hand (they anchor the flagship feature).
- **Revenue:** free-period exit backlash → founding offer must be **explicitly time-boxed in writing from day one** ("free for founding members until {date}") · ₹999 willingness untested (validation plan exists, 05§11) · season concentration smoothed by rent/buy verticals.
- **Launch:** supply target (300 listings) at 10 assisted/agent/day with quality bar = tight but feasible in 90 days with 2 agents · soft-launch (B4) converts the scary big-bang into an iteration runway.

## 4. Top 20 founder decisions to finalize before development
| # | Decision | Recommendation |
|---|---|---|
| D1 | Brand name, domain, trademark (B1) | Clear legally before public use; keep code brand-constant |
| D2 | Entity type + incorporation start (B2) | Pvt Ltd (investor-ready); start now |
| D3 | Capital commitment ₹15–20L to revenue switch | Confirm or shrink geography (Mathura-only first) |
| D4 | NCR = student-only at launch | **Yes** (blueprint call #1) |
| D5 | Free-until-liquidity + time-boxed founding offer | **Yes**, with public end date |
| D6 | Defer payments/billing build out of MVP | **Yes** (cut list) |
| D7 | Defer in-app chat; WhatsApp-first comms | **Yes** |
| D8 | Blog as MDX (no CMS at MVP) | **Yes** |
| D9 | Auth at launch: email OTP + Google; phone OTP when DLT clears | **Yes**; start DLT via MSG91 immediately after B2 |
| D10 | Email provider via marketplace at Phase 2 | **Yes** (Resend-class) |
| D11 | Aadhaar: never store full numbers | **Yes** |
| D12 | Anti-discrimination listing policy text | Approve §1.4 wording |
| D13 | Analytics: first-party only (our events + Vercel Analytics), no third-party trackers | **Yes** (perf + DPDP posture) |
| D14 | Launch sequencing (B4: autumn soft-launch → Jan warm-up → April season) | **Yes** |
| D15 | Hiring plan: 2 field ops + 1 support, start dates + who trains | Founder trains agent 1; agent 1 trains agent 2 |
| D16 | Verification fee at launch: free during founding period, ₹499 after | Recommended (removes friction when trust matters most) |
| D17 | Support WhatsApp number on entity SIM/plan | **Yes** |
| D18 | Dev/staging: local Supabase + prod project, seed scripts | **Yes** |
| D19 | Grievance officer named + registered address | Founder until scale |
| D20 | Testing shift-left: RLS + critical-path tests per phase, not Phase 11 | **Yes** (QA lens; Phase 11 becomes hardening, not first testing) |

## 5. Final MVP scope (post-audit)
**Public:** 3 journeys · student ecosystem (university search, college pages, room types) · search/filters/sort · listing detail (gallery, map, EMI, reveal, inquiry, WhatsApp/call, report) · saved searches + alerts (email + in-app) · favorites · recently viewed · client-side compare · dealer reviews · seller profiles + directories · guides (MDX) · full SEO system · NCR waitlist capture · legal pages + disclaimers.
**Seller:** 4-type onboarding · 4-step wizard with preview + autosave · media upload (client compression, EXIF strip) · room types + auto-suggested university links · listings management + renewal · leads inbox (+ CSV export) · basic stats · KYC submission.
**Admin/Ops:** approval + KYC + reports queues with reason codes · assisted listing (on-behalf-of) · field CRM-lite · seeds management (cities/areas/universities/types/amenities) · users + strikes · support tickets + macros · settings · metrics home.
**Platform:** email-OTP + Google auth (phone post-DLT) · RLS everywhere + policy tests · events capture · cron suite · notification outbox (email + in-app) · observability + health · account recovery.

## 6. V2 (liquidity-triggered, ~months 6–12)
Payments/subscriptions/boosts/invoices (pre-revenue switch) · phone OTP (post-DLT) · in-app chat · WhatsApp BSP alerts · blog CMS + comments · banners/testimonials · physical-verification tier UI + duplicate pHash · media pipeline · server compare · referral program · stamp-duty calc · visit-day planner · GBP-for-operators program · dealer analytics deep · Hindi groundwork.

## 7. V3 (year 2+)
Bed booking + rent collection · services marketplace (rent agreements, loans DSA, movers, interiors) · builder projects module · property management (NRI/Vrindavan) · Hindi UI · AI Phases B–C · price intelligence products · mobile apps · expansion playbook cities (Agra, Aligarh, Kanpur…).

---

**Bottom line:** the blueprint survives the audit. The product plan was already disciplined; this audit's value was cutting ~30% of MVP build surface (payments, chat, CMS, banners), catching four non-code blockers (brand, entity, DLT, calendar), and adding ten small-but-critical items (recovery, consent, disclaimers, discrimination policy, gaj). **Approve D1–D20 and the five strategic calls, run `vercel login`, and Phase 2 starts.**
