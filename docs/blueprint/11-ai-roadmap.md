# 11 · AI Roadmap

Rule: **AI sequenced by data availability, not by demo value.** Half the features people ask for (price prediction, matching) are data products — they come after the event capture (02§A6, 07§3) has something to eat. Stack: Vercel AI SDK + AI Gateway (`provider/model` strings, fallbacks, cost tracking), pgvector on Supabase for embeddings. Every AI surface: human-reviewable, labeled where user-facing, eval set before rollout.

## Phase A — launch-adjacent (no data dependency, immediate utility)

| Feature | Design | Guardrail |
|---|---|---|
| **Listing description generator** | Structured facts → 80–120 word description, English + Hinglish tone options; seller edits before save | Never invents facts not in the form; generated flag stored; approval reads same as human text |
| **Image intelligence at upload** | Auto-tag room type (bedroom/kitchen/exterior), suggest cover photo, quality warnings ("too dark, retake"), auto-alt-text | Suggestions only — seller confirms; feeds quality score media component |
| **Natural-language search** | "2bhk near GLA under 8k with AC" → LLM extracts structured filters → normal search runs | Deterministic filters do the retrieval (explainable, cacheable); LLM only parses intent; graceful fallback to keyword |
| **Similar listings** | pgvector embeddings over listing facts+description | Replaces hand-tuned similarity; cheap, immediate |

## Phase B — after one season of events data

| Feature | Design | Guardrail |
|---|---|---|
| **Price guidance** | Cold start: locality median ₹/sqft bands from live listings (rules, not ML) shown at listing creation → ML regression once `price_history` + sold-status data matures | Always a *range* with confidence copy; advisory only — never blocks a price; India's data sparsity makes point estimates dishonest |
| **AI chat assistant** | RAG over live inventory + guides ("hostels near Sanskriti with food under 7k?") → answers with listing cards, books visits | Answers only from retrieved inventory; "I don't have that" beats hallucinated flats; escalates to human support |
| **Seeker matching / alerts++** | Saved-search alerts upgraded with embedding-ranked "close matches you'd like" | Labeled as suggestions vs exact matches |
| **Dealer copilot** | Auto-draft lead replies, demand summaries ("3BHK demand up in your area — source these") | Drafts, never auto-sends |

## Phase C — scale (Y2+)

| Feature | Design | Guardrail |
|---|---|---|
| Fraud/duplicate ML | Classifier on risk signals + image similarity, trained on ops decisions (labels accumulating from day one via reason codes) | Assists the queue, never auto-bans (10§3 holds) |
| Voice + Hindi search | Speech → NL search pipeline; Hindi UI synergy | Bharat accessibility play |
| Photo enhancement | Relight/dedistort only. **No virtual staging that alters the property; enhanced photos labeled** | Trust brand > pretty pictures; deception here poisons the core USP |
| WhatsApp AI concierge | Assistant (Phase B) on WhatsApp Business API — full search-to-visit inside WhatsApp | The endgame interface for this market |
| Valuation product | Public locality price indices → premium reports (05 Wave 3) | Methodology published; sample sizes disclosed |

## Data prerequisites checklist (build NOW so AI is possible later)
✅ listing_events + search_events (07§3) · ✅ price_history · ✅ reason-coded ops decisions (labels) · ✅ lead outcomes pipeline (status → closed_won) · ✅ review corpus · ⬜ sold/rented prices (prompt at mark-as-sold — add one optional field: final price, private) — **this single field is the future valuation moat; costs nothing today.**

## Cost & ops
Gateway budgets per feature with fallback chains (small model default, escalate on complexity); generation cached (descriptions immutable until facts change); embeddings batch-computed on approval. AI spend visible in admin metrics from the first feature.

## v1.1 — Founder Review additions

- **Eval discipline made concrete:** each feature ships with a golden set (≥50 cases from real data), a pass-bar defined *before* building (e.g., NL-search filter extraction ≥90% exact-match on golden set; description generator 0 invented facts across set), human rubric review on a weekly sample post-launch, and a one-toggle rollback to the non-AI path. Parse-success and fallback rates are dashboard metrics, not logs.
- **Budget caps:** per-feature monthly caps set at enablement (starting point: ₹3–5k/feature/mo), hard-stop + alert at cap; unit costs (₹/description, ₹/search parse) tracked from first call.
- **Privacy rules:** no KYC documents, phone numbers, or chat transcripts to model providers — prompts carry listing facts and anonymized queries only; AI Gateway zero-data-retention posture; AI features excluded from support-360° data.
- **Hindi/Hinglish translation added to Phase B:** auto-translate listing descriptions for the Hindi UI (Y2) — cheap, high-leverage, and a data-free feature the roadmap missed.
- **Image-embedding dedup:** the Phase C duplicate-ML reuses Phase A image embeddings — pHash catches exact steals, embeddings catch re-shot/cropped steals; both feed the 10§4 merge queue.
- **Rejected in review:** AI chatbot at MVP (nothing to RAG over yet), auto-approved AI descriptions (human seller confirm stays mandatory), AI-set pricing (advisory-range only, permanently — platform-set prices = liability + dealer revolt).
