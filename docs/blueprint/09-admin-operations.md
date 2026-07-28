# 09 · Admin Operations Blueprint

Trust is an ops discipline wearing a product costume. This document is the ops half of the promise. Team at launch: **founder + 2 field ops + 1 support (L1)** — every workflow below is designed for that headcount, then scales by adding people to queues, not by re-architecting.

## 1. Operating rhythm & SLAs
| Queue | SLA | Owner |
|---|---|---|
| New listing approval | < 4 business hours | Ops |
| Edited listing re-review (price ±30%, location, media) | < 4h | Ops |
| KYC / verification requests | < 24h | Ops |
| Reported listing — severity high (fraud/safety) | < 2h, listing auto-held | Founder/Ops |
| Reported listing — normal | < 24h | Ops |
| Support first response | < 2h business hours | L1 |
| Payment/billing issues | < 4h | L1 → founder |

Daily rhythm: morning queue sweep → afternoon field verifications (routed by locality batches) → EOD metrics glance. Every queue shows age-sorted items with SLA countdown; breaches surface on the admin home.

## 2. Property approval workflow
Checklist per listing (rendered in the approval UI, keyboard-driven):
1. **Geo sanity** — pin inside claimed locality? (auto-flag if pin >2km from area centroid)
2. **Photos** — ≥3, real (not stock/watermarked competitor shots), match property type
3. **Price sanity** — within locality band (auto-flag beyond p5/p95 once data exists; manual judgment until)
4. **Duplicate scan** — auto-surfaced candidates (same geo+type+price ±5%, later image pHash)
5. **Content policy** — no phone numbers/URLs in description (regex pre-flag), no discriminatory text beyond lawful preferences, no "contact for price"
6. **Completeness** — quality score preview; below-threshold listings bounce with coaching, not rejection

**Reason codes (structured, seller-visible, macro-attached):** `PHOTOS_INSUFFICIENT`, `PHOTOS_FAKE`, `PRICE_IMPLAUSIBLE`, `LOCATION_MISMATCH`, `DUPLICATE`, `CONTENT_POLICY`, `INCOMPLETE`, `SUSPECTED_FRAUD` (this one routes to T&S, doesn't notify normally). Every rejection = one tap to a templated, fixable explanation. Approval/rejection rates per admin tracked (consistency review).

## 3. Fake listing & spam handling
**Detection sources:** user reports · approval heuristics · velocity rules (N listings/day from new account) · disposable/virtual number patterns · description similarity across accounts · seeker complaint keywords in support · (later) image pHash vs known-fake corpus.

**Strike ladder (recorded in `strikes`):**
1. Warn + unpublish offending listing
2. 7-day listing privileges suspension
3. Account ban + `blocked_identifiers` (phone hash, device) — re-registration blocked

Evasion: new accounts matching blocked identifiers or geo+content fingerprints auto-hold for manual review. **Bait-price policy is zero-tolerance after one warning** — it's the #1 trust killer on incumbent portals and our core differentiation.

## 4. Reports queue
Severity matrix: **Fraud/safety** (auto-hold listing pending review) → **Wrong info** (48h seller fix-it window, then unpublish) → **Sold/stale** (prompt seller; auto-expire path) → **Spam/other**. Reporter gets closure notification (report → resolution loop builds reporter trust; silent black holes train users to stop reporting).

## 5. Support playbook (L1)
- **Channels:** WhatsApp Business number (primary — meet the market), in-app form, email. All land in `support_tickets` with channel tag.
- **Top intents get macros day one:** how to list, edit/renew listing, why rejected (auto-attaches reason code), lead not responding, payment/invoice, delete account, report fraud.
- **360° pane:** requester's profile, listings, leads, payments, strikes in one view; **read-only impersonation** (audit-logged) for "what does the user see" debugging.
- **Escalation:** L1 → Ops (listing/verification disputes) → Founder (legal, fraud, refunds > ₹2k, press/authority contact).
- **Deflection loop:** every intent >5×/week gets a product fix or FAQ entry — support volume is a product-bug list, reviewed weekly.

## 6. Moderation (reviews, chat, content)
- Reviews: lead-verified authors only; pending → approved/rejected with reason; seller reply allowed (one, public); brigading pattern detection later.
- Chat: keyword screens (off-platform payment solicitation, abuse) flag threads to a moderation sub-queue; users can report in-thread.
- Blog comments: pending-by-default, admin-approved.

## 7. Assisted listing ops (supply engine)
WhatsApp intake (photos + facts template) → ops creates via `on_behalf_of` → owner receives claim link (OTP) → listing attributed `created_by_ops` for funnel analytics. Target: <15 min/listing; field team quota ~10/day each during launch push.

## 8. Ops metrics (admin home)
Approval SLA compliance · median approval time · rejection rate by reason · verification throughput · duplicate catch rate · support first-response/resolution/CSAT · strikes issued · assisted-listing count · listing freshness distribution · ops-sourced supply %.

## 9. Tooling requirements this implies (Phase 4 scope)
Unified queue framework (one component, many queues) · reason-code system · macro system · 360° user pane · impersonation (read-only + audit) · bulk actions · SLA timers · admin action log on everything (already in `audit_logs`) · field CRM-lite (below).

## 10. v1.1 — Founder Review additions

- **Field ops CRM-lite** (tooling for §7 and 12§1, was untracked): prospect pipeline with stages, locality-batched daily routes, visit logs, per-agent quotas (10 assisted listings/day launch push), assisted-listing attribution and approval pass-rate per agent (>90% = field quality bar). Backed by `seller_onboarding` (07§8).
- **Staffing math (so SLAs are physics, not vibes):** launch volume ≈ 20–40 new+edited listings/day ⇒ 1–2 ops-hours/day of approvals. NCR student season multiplies queues 3–5× for ~10 weeks ⇒ pre-planned temp reviewer + relaxed non-critical SLAs (KYC 48h) during surge, approval SLA never relaxed.
- **Consistency audits:** weekly random re-review of 10 approvals/rejections by founder; disagreements become checklist edits. Reviewer drift is how trust brands quietly die.
- **Refund/dispute workflow:** matrix per 05§10; all refunds reason-coded + audit-logged; payment disputes get a 4h first-touch and founder eyes.
- **Seller education program (support deflection + quality):** WhatsApp broadcast tips (photo quality, response speed), monthly 30-min onboarding call for new dealers, wizard inline help — every support intent >5×/week also becomes an education item, not just an FAQ.
- **Support hours published:** 9:00–21:00 IST, 7 days (season), first-response SLA applies within hours; out-of-hours auto-ack with queue position.
- **Incident basics (cross-ref 10§v1.1 runbook):** uptime monitor + health endpoint alerts (08) page the founder; a public "known issue" banner is one admin toggle away; post-incident note template (what/impact/fix/prevention) — even a two-line one — after every user-visible incident.
- **SOP versioning:** playbooks live in `docs/ops/` (repo-versioned like code); new-hire ramp = shadow day + checklist + first-week audit of 100% of their queue actions.
