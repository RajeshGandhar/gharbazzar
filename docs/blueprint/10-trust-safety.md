# 10 · Trust & Safety Blueprint

The brand IS the trust layer. Everything here feeds two numbers users can feel: *"listings are real"* and *"people are who they say they are."*

## 1. Verification ladder

| Level | Name | Requirements | Shown as |
|---|---|---|---|
| L0 | Phone-verified | OTP (mandatory to list) | — (baseline, invisible) |
| L1 | ID-verified | Govt ID (owners) / PAN+GST or RERA (agents, PMs) / registration docs (builders) reviewed by ops | "ID Verified" badge |
| L2 | Property-verified | Ownership/authority document for the specific listing, or physical field visit | **"GharBazaar Verified"** green badge (the flagship) |
| L3 | Trusted Partner | L2 + 6 months clean record + response rate >80% + rating ≥4 | "Trusted Partner" gold badge, ranking boost, homepage eligibility |

Per persona: owners L1 via Aadhaar-class ID; agents require RERA number where applicable (UP RERA for Mathura, plus DL/HR in NCR); PG operators L2 via field visit (girls' accommodations **prioritized** for physical verification — parent trust is the market); builders L2 via RERA project registration. Verification state lives in `verification_requests` workflow + badge fields; expiry/re-verification annually for L2+.

## 2. Listing quality score (0–100, stored, recomputed on change)
| Component | Weight |
|---|---|
| Completeness (fields, amenities, room types for PG) | 30 |
| Media (photo count/resolution/diversity; video bonus) | 25 |
| Seller responsiveness (response rate × speed) | 20 |
| Freshness (updated/renewed recency) | 15 |
| Verification level | 10 |

Uses: **organic ranking input** (quality beats recency beats paid — sponsored is labeled and separate), seller coaching UI ("Add 3 photos → +9 points"), approval fast-lane for high-score sellers, eligibility floor for featured slots (paying doesn't excuse a garbage listing).

## 3. Risk score (internal only, per account + per listing)
Signals: account age & completion · listing velocity · price z-score vs locality · geo-pin vs claimed locality distance · duplicate-cluster membership · report count/severity · chat payment-solicitation flags · device/IP shared with struck accounts · reveal-to-listing ratio anomalies (scraper pattern).
Actions by band: **watch** (nothing visible) → **hold** (listings queue for enhanced review) → **restrict** (no new listings, existing shadowed from featured) → **block** (T&S review → strike ladder, 09§3). All transitions audit-logged; no silent automation above "hold" — a human confirms restrict/block at our scale.

## 4. Duplicate detection
- MVP: candidate surfacing at approval — same locality + type + price ±5% + area ±10%; admin merge tool (canonical survives, duplicate 301s to it, both sellers notified with policy note).
- V1.1: image pHash across corpus (catches the classic "same flat, four brokers" and stolen-photo listings), title shingling.
- Policy: exclusive-listing conflicts (two agents, one property) → both flagged, owner asked to designate; non-designated becomes "also listed by".

## 5. Fraud taxonomy & countermeasures
| Scheme | Countermeasure |
|---|---|
| Bait pricing (fake cheap listing → upsell calls) | Price sanity at approval, zero-tolerance strikes, seeker report prompt after reveal ("Was this price real?") |
| Token-before-visit scam | Education interstitial at every reveal ("Never pay before visiting"), chat keyword flags, scam-report fast lane |
| Stolen photos / fake property | pHash (V1.1), physical verification tier, reverse-image spot checks by ops |
| Identity misrepresentation (broker posing as owner) | "Listed by Owner" claims require L1 + declaration; violations = strike |
| Rental advance fraud (fake landlord, urgency pressure) | Landlord L2 verification badge prominence; safety copy on rent listings |
| Scraping/contact harvesting | Reveal metering + rate classes (08), numbers never in markup pre-reveal |

## 6. Platform safety features (user-facing)
Report on every listing/profile/chat thread · reveal-flow safety education · girls' PG safety facts structured (warden, curfew, CCTV — verified at L2 visit) · seller reply rate/time public · "How we verify" public page (trust marketing + honest limits: L1 ≠ ownership guarantee — overpromising verification is a lawsuit) · no seeker location shared with sellers beyond chosen locality.

## 7. Privacy & compliance (India)
- **DPDP Act 2023:** consent notices at collection, purpose limitation, deletion rights (account deletion cascades already modeled; listing archives anonymize contact link), grievance officer contact published, breach-notification runbook.
- **KYC vault:** private bucket, least-privilege access (ops role only, access-logged), retention: deleted 90 days after account closure or rejection; **never** in support 360° pane by default (explicit elevated view).
- EXIF/GPS stripped from all uploaded media (owner home privacy).
- Phone masking until reveal; reveals logged and visible to the seller ("who got my number": count, not identities, for seekers' privacy).
- T&C/listing policy/refund policy/privacy policy drafted before public launch (founder + lawyer; templates are not optional at the point money or claims of "verified" enter).

## 8. Honesty constraints (what we may NOT claim)
Badges state exactly what was checked and when. "Verified" ≠ title guarantee, ≠ legal due diligence — copy reviewed against this rule. The fastest way to lose the trust brand is one over-claimed badge in one court case.

## 9. v1.1 — Founder Review additions

- **IT Rules 2021 intermediary compliance (was missing — legally required, not optional):** published **Grievance Officer** (name + contact), acknowledgment within 24h and resolution within 15 days of complaints; content takedown on lawful notice within statutory windows; terms must state the intermediary role. This sits alongside DPDP consent/deletion duties in §7.
- **Appeals process (fairness + legal posture):** strikes and bans are appealable in-product; founder reviews within 7 days; outcome + reasoning recorded in `audit_logs`. No permanent ban without a second human look.
- **User blocking (02§F2):** either party blocks at conversation level; blocks suppress chat + future reveals bidirectionally and feed the risk score. Harassment report category added (priority routing, female-seeker reports flagged high-severity by default).
- **Female seeker defaults:** profile photo and full name never shown to sellers pre-reveal; reveal shows first name only. Safety copy tuned on girls' PG pages (what to check on the visit, verified-warden badge meaning).
- **Verification capacity math:** field agent ≈ 8–10 L2 visits/day (locality-batched); ₹499 fee covers marginal cost ≈ ₹150–300 + margin; girls' accommodations jump the queue at no extra fee (brand investment, not a revenue line).
- **Incident-response runbook:** SEV-1 (data breach / fraud wave / verified-badge scandal): founder + counsel same-day, affected-user comms within 72h, DPDP breach-notification duty checked, public note if user-visible. SEV-2 (localized fraud pattern): T&S sweep of matching listings within 24h. Every SEV gets a written post-mortem.
- **Honeypot policy (deferred deliberately):** decoy listings for scraper/fraud detection only with founder sign-off and legal review — entrapment optics can cost more than the caught fraud. Revisit at V1.1.
- **Field staff safety (ops duty of care):** visits logged with live location share to base during L2 verifications; two-person rule for flagged-risk addresses.
