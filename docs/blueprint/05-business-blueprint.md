# 05 · Business Blueprint

## 0. The one rule
**Liquidity before monetization.** Charging before the marketplace has lead-flow kills tier-2/3 platforms (dealers churn, tell each other, market poisoned). Revenue switches on per-city at gates: ≥300 live listings AND ≥25 qualified leads/day AND median response < 2h. Until then: everything free, aggressively so.

## 1. Revenue lines — sequenced

### Wave 1 (post-liquidity, Y1)
| Line | Mechanics | Pricing default (admin-editable) |
|---|---|---|
| Dealer subscriptions | Free 3 / Silver 15 / Gold 50 / Platinum ∞ listings + featured slots + analytics | ₹999 / ₹2,499 / ₹4,999 /mo |
| Owner boosts | One-time: Featured 30d, "Urgent sale" tag, homepage slot | ₹499–₹999 |
| Student Housing Pro | Room inventory tools, priority on college pages, season campaigns | ₹1,499/mo per property |
| Verification fee | Physical verification visit + badge (owners & dealers) | ₹499/listing |
| Banner ads | Local businesses (furniture, movers, banks) on browse pages — capped, never on detail pages | slot-based |

### Wave 2 (Y1–Y2)
| Line | Mechanics |
|---|---|
| Lead packages | Pay-per-qualified-lead alternative for non-subscribers (auto-priced by locality demand) |
| Rent agreement service | E-stamped agreement + delivery, partner-executed — proven ₹199–₹499 attach |
| Home-loan referrals | DSA partnerships with banks/NBFCs; 0.3–0.5% of disbursed amount on buy leads |
| Builder promotion | Project placement priced on verified site-visit bookings, not impressions |
| Packers & movers, interiors | Lead rev-share with vetted partners |

### Wave 3 (Y2+)
| Line | Mechanics |
|---|---|
| Student bed booking | Token booking online; commission per filled bed (₹500–1,000 or % of first month) |
| Rent collection | Monthly rent via platform for operators; 1–2% + float; makes us their back office |
| Property management | NRI-owned Vrindavan flats: tenanting + upkeep at 8–10% of rent — high-margin Braj-specific |
| Insurance / advisory / NRI desk | Partner distribution; advisory for investment buyers |
| Price intelligence | Locality reports for builders/investors once data density allows |

## 2. What we will NOT do (positioning guardrails)
1. **Never charge seekers for contacts** (anti-NoBroker stance: "Always free to find"). Marketing weapon and moral high ground.
2. **Never sell ranking silently.** Sponsored slots are labeled; organic rank runs on quality score. The portals' pay-to-bury model is exactly the trust rot we exploit.
3. **No ad-tech carpet.** Third-party programmatic would torch both CWV and premium positioning.

## 3. Unit economics sketch (Mathura, steady state — assumptions to validate)
- Active dealers ~200; 20% paid at blended ₹1,800/mo → **₹72k MRR**
- Student Pro: 60 operators × ₹1,499 → **₹90k MRR** (seasonal skew)
- Boosts/verification/ads → **₹40–60k/mo**
- **City total ≈ ₹2.0–2.2L/mo** against city ops cost ≈ ₹1.2–1.5L (2 field + 1 support + tools) → contribution-positive per city, before services revenue. NCR student beachhead economics are a multiple of this. *These are planning numbers, not promises — validate in-market.*

## 4. Pricing psychology
- Anchor on Gold; Silver is the volume plan; Platinum exists to make Gold look sane.
- Annual = 2 months free (cash-flow + churn lock).
- Founding-dealer offer at launch: "Free Gold for 6 months, locked ₹1,499 after" — onboarding weapon with built-in conversion event.
- Boosts priced impulse-low; the receipt that converts owners is "featured listings get 5× views" **shown with their own listing's numbers**.

## 5. Costs to watch
SMS OTP (push WhatsApp-auth where possible), Maps API (cache geocodes, static maps on cards, interactive map only on demand), storage/egress (image pipeline compression), verification ops (batch by locality routes), CAC per dealer (field visit ≈ ₹300–500 — cheap vs metro digital CAC; this is the tier-2 arbitrage).

## 6. Funding narrative (for when it's needed)
Wedge (student housing, zero credible national player) → repeatable unit (campus-city playbook, contribution-positive) → expansion math (400+ campus cities in India) → transaction layer (bookings, rent, loans) on owned demand. Traction proof: Mathura dominance + one season of student bookings.

---

## v1.1 — Founder Review additions

### 7. Burn & runway (pre-revenue reality)
| Item | Monthly (₹) |
|---|---|
| Field ops ×2 + support ×1 | 90k–1.2L |
| Tools/infra (Vercel, Supabase, Maps, SMS/OTP, misc) | 25–40k |
| Marketing cap (launch phase) | ≤50k |
| **Run rate** | **≈1.7–2.1L/mo** → liquidity gate at ~month 6 ⇒ **₹12–15L to revenue switch** (+ pre-launch one-offs ~₹2–3L: legal, brand, collateral) |

### 8. LTV:CAC sanity (dealer)
CAC (field visit + offer cost) ≈ ₹500–800. LTV at ₹1,800 blended ARPU × 12mo × ~70% margin ≈ ₹15k ⇒ **LTV:CAC ≈ 20:1 if churn ≤8%/mo is real** — churn is the number to defend, hence demand-digest + founding lock-ins. Sensitivity: at 15% churn LTV halves; still healthy, but pricing tests matter more than pricing theory.

### 9. Revenue additions found in review
- **Owner "Sell Faster" bundle** ₹999: boost + verification + photo-guidance call (attach at listing publish).
- **À-la-carte featured slots** for subscribed dealers who hit plan limits.
- **Tenant-verification reports for operators** (₹99/tenant, Wave 2) — operator-side, seeker never pays.
- **College-page education sponsorships** (coaching/institute ads, labeled, never disguised as listings) — season revenue.
- **Data/API products** (Wave 3): locality indices for banks/valuers, once sold-price corpus exists (11).

### 10. Billing operations (missing before)
GST: 18% on all SaaS/boost invoices, GSTIN on invoices (already modeled), registration before revenue switch. **Dunning:** card/UPI autopay fail → 3 retries over 7d + WhatsApp/L1 call (high-touch beats email at this scale) → grace 7d → downgrade to Free (listings paused beyond limit, never deleted). **Refund matrix:** ≤₹999 self-serve within 7d if unused; above → founder approval; verification fee non-refundable after visit scheduled.

### 11. Price validation plan (before the switch)
Founding-cohort interviews (n=20 dealers) on willingness bands; A/B the founding-offer conversion letter; boost price test ₹299 vs ₹499 on owners. Prices in this doc are hypotheses with admin-editable implementations — treat them as such.

### 12. Incumbent free-dump counter (scenario)
If a portal dumps free premium in Mathura: we don't discount — we accelerate demand-digest value, founding badges, and physical presence. Their offer expires; our relationships don't. (Cross-ref 01 risk register, 12 v1.1 scenarios.)
