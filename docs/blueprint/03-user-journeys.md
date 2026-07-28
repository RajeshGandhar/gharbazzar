# 03 · User Journey Document

Format per persona: **Entry → Decision flow → Actions → Pain points → Improvements shipped**.

---

## 1. Buyer (family, Mathura, ₹30–60L budget)
- **Entry:** Google "plot in mathura price" / word of mouth → `/buy` or a locality SEO page.
- **Decision flow:** locality shortlist → budget filter → 15–20 listings viewed over 2–6 weeks → 4–6 site visits → negotiate → legal check → close.
- **Actions:** search, save favorites, compare, reveal contacts, WhatsApp dealers, schedule visits, EMI calc.
- **Pain points:** fake prices to bait calls; stale listings; can't tell honest dealer from tout; spouse/parents must approve; legal fear (disputed land is THE Mathura fear).
- **Improvements:** verified badge + freshness label; price-sanity check at approval; shareable compare links for family; "documents verified" tier; stamp-duty-aware EMI; saved-search alerts so they return.

## 2. Tenant (young professional / refinery employee)
- **Entry:** Google "1BHK rent mathura" → `/rent`; or transferred employee searching from another city.
- **Decision flow:** budget + locality + furnishing → shortlist 5 → visit 2–3 → decide in 3–7 days (fast cycle!).
- **Actions:** filter by preferred-tenants/available-from, reveal contact, WhatsApp, visit, close.
- **Pain points:** "bachelors not allowed" discovered after calling (wasted calls); deposit surprises; broker fees unclear; remote searching without local presence.
- **Improvements:** preferred-tenants + deposit shown on card (not buried); video walkthroughs prioritized in ranking; response-rate badges route them to live dealers; rent-agreement service (roadmap) closes the loop.

## 3. Student / Parent (GLA admission, June)
- **Entry:** Google/Instagram "PG near GLA University" → `/college/gla-university`. **The parent is the decision-maker; the student is the searcher.**
- **Decision flow:** university page → gender + budget + sharing filter → shortlist with distances → parent reviews → visit during admission trip (1–2 days in town!) → book.
- **Actions:** compare room types, check meals/curfew, WhatsApp owner, schedule visits back-to-back.
- **Pain points:** one admission trip = must line up 5 visits in a day; safety anxiety (girls' PG especially); photos lie; mess quality unknown; prices jump in season.
- **Improvements:** multi-visit day planner (shortlist → suggested visit route); stay-verified student reviews; warden/curfew/mess facts structured, not prose; "parent view" share card summarizing safety facts; distance shown from *their* college, computed.

## 4. Owner (FSBO, one flat in Radhapuram)
- **Entry:** hears "list free on GharBazaar" via WhatsApp/local ad → `/sell` → "I'm an Owner."
- **Decision flow:** can I do this myself? → how much effort? → is it safe to show my number?
- **Actions:** phone OTP → 4-step wizard (or assisted listing via WhatsApp) → approval → leads arrive → mark as sold.
- **Pain points:** tech intimidation; broker harassment after number exposure; no idea what price to ask; listing dies unnoticed.
- **Improvements:** assisted listing (A2); masked contact until reveal (only genuine seekers); price guidance from locality data; renewal nudges; "3 people saved your property this week" engagement pings.

## 5. Dealer / Agent (8 active listings, works via WhatsApp)
- **Entry:** field team onboarding visit / peer referral → `/sell` → "I'm a Dealer."
- **Decision flow:** is this free? → do leads actually come? → is the dashboard less work than my notebook? → (later) is Silver worth ₹999?
- **Actions:** KYC, bulk-add listings (assisted at onboarding), respond to leads, update statuses, renew, upgrade.
- **Pain points:** portals charged him and sent junk leads; double-selling by other brokers of *his* exclusive property; no time for dashboards.
- **Improvements:** free at launch (liquidity first); lead quality over quantity (dedupe, seeker context attached); WhatsApp-forwarded leads so his workflow doesn't change; demand-near-you widget tells him what to source; public response-rate rewards the diligent.

## 6. PG/Hostel operator (40-bed girls' hostel near GLA)
- **Entry:** campus-adjacent field visit / operator WhatsApp groups → `/sell` → "PG/Hostel operator."
- **Decision flow:** will parents trust an online listing? → can I show room categories properly? → seasonal: fill beds by July.
- **Actions:** wizard with room types + per-bed pricing + university links; seasonal bed-count updates; respond to visit requests.
- **Pain points:** vacancy is invisible (students only find via seniors); no way to signal "girls only, warden, 8pm curfew" credibly; season concentration.
- **Improvements:** structured safety facts; college-page placement; pre-season "update your beds" campaign; Student Housing Pro placement; booking + rent collection (roadmap) makes us his back office.

## 6b. Property manager (manages 12 NRI-owned Vrindavan flats)
- **Entry:** `/sell` → "Property Manager" — lists and manages on behalf of owners; multi-property dashboard from day one.
- **Pain points:** portals force one-account-one-owner fictions; no way to signal professional management.
- **Improvements:** `seller_type = property_manager` with managed-portfolio listing attribution; "Professionally managed" chip on listings (renter trust signal); natural future upsell path to our own property-management service (05 Wave 3) — they become partners, not competitors.

## 7. Builder (Vrindavan township project) — *roadmap persona*
- **Entry:** sales outreach → `/sell` → "Builder" waitlist (MVP) → Projects module (Y2).
- **Flow (future):** project page with RERA number, towers/units, possession dates, site-visit booking, NRI desk routing.
- **Pain point today:** portals charge ₹lakhs for junk visibility. Our future pitch: pay for verified visit bookings, not impressions.

## 8. Super Admin / Ops
- **Entry:** `/admin` (daily operating rhythm, not occasional visits).
- **Morning loop:** approval queue (SLA timer) → reported listings → KYC queue → support inbox → yesterday's metrics.
- **Actions:** approve/reject with reason codes, verify docs, merge duplicates, manage seeds (areas/universities), configure plans/banners, refund/adjust billing.
- **Pain points (pre-empted):** decision fatigue → checklists + reason codes; context switching → unified queues with keyboard flow; abuse whack-a-mole → strike system + fingerprints.
- **Improvements:** every queue has SLA + owner; bulk actions; read-only impersonation for debugging (audit-logged).

## 9. Support staff (L1)
- **Entry:** WhatsApp support number + in-app contact form → shared inbox in admin.
- **Flow:** triage (billing / listing help / report / bug) → macros for top 20 intents → escalate L2 (ops) or founder (legal/fraud).
- **Pain points (pre-empted):** no user context → support view shows profile, listings, leads, payments in one pane; repeated questions → public FAQ + listing-wizard inline help.
- **KPIs:** first response < 2h business hours; resolution < 24h; CSAT thumb on close.

---

## Cross-journey principles
1. **Every journey has a WhatsApp exit** — meet users in their OS.
2. **Nobody hits a login wall while browsing** — auth gates only at contact reveal, save, or list.
3. **Every empty state sells the next action** ("No 2BHKs here yet — get alerted when one arrives").
4. **The parent/spouse is a silent persona in every consumer journey** — shareability is a feature, not garnish.

---

## v1.1 — Founder Review additions

## 10. Returning seeker (the retention journey — was missing)
- **Entry:** saved-search alert email/notification → straight to the new listing (deep link, no re-search).
- **Flow:** alert → listing → reveal/visit → refine alert or close search ("Found a place? Tell us" → review ask + services handoff).
- **Pain points:** alert fatigue (too many/irrelevant) → digest option + per-alert mute; listing gone by the time they click → freshness discipline + "similar still available".
- **KPI:** alert CTR > 25%, D30 alert-driven return rate.

## 11. Field ops agent (internal daily user — was missing)
- **Entry:** admin field CRM on a phone, standing in a dealer's shop.
- **Flow:** today's route (locality batch) → prospect pane → assisted listing in <15 min → photo checklist → mark visit outcome → next.
- **Pain points:** patchy connectivity → wizard autosave + offline-tolerant uploads; duplicate prospect visits → pipeline dedupe by phone.
- **KPI:** listings/agent/day, prospect→active conversion, assisted-listing approval pass rate (>90% — field quality bar).

## Seller rejection/appeal loop (added to journeys 4–6)
Rejection notice = reason code + exact fix + one-tap resubmit; two rejections → offered assisted help, not a third form. Strike/ban appeals per 10 (v1.1).

## Per-journey activation metrics
| Persona | Activation event |
|---|---|
| Buyer/Tenant | first contact reveal |
| Student | first visit scheduled |
| Owner | first listing live |
| Agent | 3 listings live + first lead responded |
| Operator | room types complete + first season update |
| Returning seeker | first alert click |
