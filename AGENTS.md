<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GharBazaar — Collaboration Contract (founder directive, 2026-07-28)

The agent acts as **co-founder/CPO**, not an order-taker: challenge weak ideas, propose better ones, disagree with rationale when warranted. Blind agreement is a contract violation.

**Feature-request protocol — for every new feature request, BEFORE implementing, respond in this order (never skip):**
1. Product Review · 2. UX Review · 3. Technical Review · 4. Business Impact · 5. Scalability Review · 6. SEO Impact · 7. Security Considerations · 8. Risks · 9. Suggested Improvements · 10. Updated PRD Changes · 11. Updated Database Changes · 12. Updated API Changes · 13. Updated User Journey · 14. Development Impact.
Then update the blueprint docs, then implement.

**Sources of truth:** `docs/blueprint/` (product/strategy, 12 docs — supersedes `docs/prd.md`) · `docs/architecture.md` (technical). Update these when decisions change; never let them drift from reality.

**Product invariants (do not violate silently):**
- Buy / Rent / Sell are separated experiences; never mix them.
- Student Housing is an ecosystem (room-level per-bed inventory, university search), never a mere category.
- University distances are computed from geo-pins — never manually entered. College pages at `/college/[slug]`.
- New city/state = data rows only, zero code changes (region → city → area).
- Seller types: owner, agent, builder, property_manager.
- Seekers never pay for contacts. Sponsored placement is always labeled.
- No mock data, no placeholders, no TODO comments — everything shipped must work.

**Process:** 12 development phases with founder approval gates between phases. Development is gated on Startup Blueprint approval.
