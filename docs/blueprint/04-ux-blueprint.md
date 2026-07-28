# 04 · UX Blueprint

Design promise: **premium but not intimidating** — luxury aesthetics (glassmorphism, green/white/dark-gray, motion) applied to an interface a 45-year-old Mathura PG owner can operate on a ₹12k Android phone over 4G.

## 1. The 3-second rule (enforced, not aspirational)
- `/` renders three dominant intent cards — **Buy · Rent · List your property** — plus a Student Housing spotlight. No mixed feed, no carousel roulette.
- Journey switcher pinned in navbar site-wide; active journey owns the header accent.
- Breadcrumbs + journey-tinted UI answer "where am I?" on every page.

## 2. Anti-patterns we explicitly ban (learned from the incumbents)
| Portal habit | Our rule |
|---|---|
| Login wall to see anything | Browse everything anonymously; auth only at reveal/save/list |
| 40-filter sidebar wall | 6 primary filters visible; rest behind "More filters"; applied filters as removable chips |
| Popup carpet-bombing (app nags, lead forms) | One polite saved-search prompt after engagement signals; that's it |
| Fake urgency ("5 people viewing!") | Real signals only: freshness, response rate, verified badge |
| Burying price ("Contact for price") | Price mandatory to publish; no exceptions |
| 8MB pages with ad iframes | CWV budget: LCP < 2s on Fast-4G; zero third-party ad scripts |

## 3. Mobile-first mechanics (70%+ traffic will be mobile)
- Thumb-zone: primary CTAs bottom-anchored; **sticky contact bar** (WhatsApp · Call · Visit) on listing detail.
- Cards: photo-first (4:3 swipeable gallery *in the card*), price in ₹ Lakh/Cr, 3 fact chips (BHK · sqft · locality), verified badge, freshness.
- Search results ≤ 2 taps from home: intent card → city/locality prefilled by geolocation prompt (graceful decline path).
- Contact ≤ 3 taps from results: card → detail → reveal. Measured as a core funnel metric.
- Filters as bottom sheet, instant result-count preview ("See 43 properties").

## 4. Bharat-first details (the difference between designed-in-Bangalore and works-in-Mathura)
- **₹ Lakh/Crore everywhere**; sqft ⇄ gaj toggle (plots are quoted in gaj in Braj!).
- Language simple; iconography heavy; roadmap Hindi toggle — **all strings externalized from day one**.
- Photos-first cards for low-literacy comfort; voice search roadmap.
- Data-light mode: thumbnails lazy, no autoplay video on cellular.
- WhatsApp share renders a rich card (OG image with photo + price + locality) — the family-group unit of virality.

## 5. Onboarding & forms
- **Seeker:** zero onboarding. Value first, account when needed (reveal/save) via phone OTP — one field, one tap.
- **Owner:** "List in 5 minutes" — 4 steps (What & Where → Details → Photos → Contact & Review), autosave + resume link, photo tips inline ("daylight, landscape, no fingers"). Assisted-listing escape hatch on every step: "Send details on WhatsApp instead."
- **Dealer:** business onboarding split across sessions — start listing immediately, KYC nudged before 3rd listing goes live.
- **Operator:** room-type builder with live preview of how students will see per-bed pricing.

## 6. Trust surfaces (conversion IS trust here)
- Verification ladder rendered as badges with plain-language tooltips ("Documents checked by GharBazaar on 12 Jul").
- Dealer cards: response rate, median response time, active-listings count, member-since, review stars.
- Listing: freshness stamp, view/save counts (real), computed university distances, geo-pin map (approximate circle until reveal — owner privacy).
- Safety education inline: "Never pay a token before visiting" on every reveal action.

## 7. State design (premium feel lives here)
- **Loading:** skeletons matching final layout; no spinners on primary surfaces; motion 150–250ms ease-out, `prefers-reduced-motion` respected.
- **Empty:** always sell an action (create alert / broaden filters / list your property).
- **Error:** human copy + retry; never a raw code.
- **Success:** listing-published moment celebrated (share prompt: "Forward to your WhatsApp contacts").
- Dark/light both first-class; luxury green treatment tuned per theme.

## 8. Accessibility & quality bar
- WCAG AA contrast (glassmorphism is the enemy of contrast — token system enforces floors), full keyboard nav, focus states, semantic landmarks, alt text pipeline on listing photos (auto-suggested, editable).

## 9. Conversion instrumentation (design decisions get measured, not debated)
Funnels tracked from day one: search→detail, detail→reveal, reveal→WhatsApp-open, wizard step-drop, alert-create rate, D7 return via alert. Every UX change argues with these numbers.

---

## v1.1 — Founder Review additions

### 10. Core screen inventory (~26 screens; each named with its ONE primary action)
| Area | Screens | Primary action |
|---|---|---|
| Public | Home (choose intent) · Buy hub · Rent hub · Student hub · College page · Browse/results (list+map) · Listing detail · Seller profile · Guides | Detail → **Reveal/WhatsApp** |
| Auth | OTP sign-in · OAuth callback (2) | Complete in one screen |
| Seeker | Saved items · Alerts manager · Compare · Inbox · Visit list (5) | Return to a listing |
| Seller | Dashboard · Wizard (4 steps, one screen shell) · My listings · Leads pipeline · Analytics · Billing (6) | Wizard → **Publish**; Leads → **Respond** |
| Admin | Queue shell (reused: approvals/KYC/reports/tickets) · Listing review · 360° user · Field CRM · Seeds/settings · Metrics (6) | Queue → **Approve/Reject** |
Anything not on this list needs a reason to exist.

### 11. First-run & flaky-network design
- **Seller first-run:** dashboard empty state = wizard CTA + "or WhatsApp us" (assisted); after first publish: "what happens next" (approval SLA shown).
- **Network:** wizard autosaves per-field with retry queue; uploads resumable + background; optimistic UI only for reversible actions (favorite), never for publish/payment; explicit offline banner with queued-changes count.

### 12. Microcopy & language
English UI with Hinglish-tolerant, spoken-register microcopy ("Photo daalein — daylight best hai" style reserved for seller-side hints); no legalese outside legal pages; all strings externalized (Hindi Y2 flip).

### 13. Accessibility additions
44×44px minimum touch targets; error messages tied to fields via `aria-describedby` with plain-language fixes; focus trap discipline in sheets/dialogs; skeleton→content without layout shift (CLS budget owns this).

### 14. Notification permission stance
Never request browser push. In-app inbox + email (+ WhatsApp Wave 2) only — permission begging is trust-negative in this market.

### 15. Post-reveal follow-through (conversion + trust loop)
24h after a reveal: one prompt — "Did you connect with {seller}?" → yes (review seed later) / no response (nudges seller, feeds response-rate) / report a problem (T&S intake). Closes the loop the incumbents leave open.
