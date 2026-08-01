-- ---------------------------------------------------------------------------
-- Critical RLS fixes — audit findings C1 and C2 (2026-07-31 due-diligence audit)
--
-- C1: "inquiries: customer insert" required customer_id = auth.uid() with no
--     escape hatch for NULL, but POST /api/v1/properties/:id/inquire is
--     explicitly designed to accept anonymous submissions (customer_id is
--     null for guests). Every anonymous inquiry was rejected by RLS.
--     Fix mirrors the existing, correct "reports: insert" policy pattern.
--
-- C2: "contact_reveals" had no INSERT policy at all (only the "participants
--     read" select policy), but revealContact() in
--     src/features/properties/server/mutations.ts writes through the
--     RLS-bound session client (not the admin client) — every reveal
--     request failed with a policy violation.
-- ---------------------------------------------------------------------------

-- C1: allow anonymous inquiries (customer_id null) in addition to the
-- authenticated-customer case.
drop policy if exists "inquiries: customer insert" on public.inquiries;
create policy "inquiries: customer insert" on public.inquiries
  for insert with check (customer_id = (select auth.uid()) or customer_id is null);

-- C2: allow the revealing user to insert their own reveal record. Matches
-- the "participants read" policy's ownership check (user_id = auth.uid()).
create policy "contact_reveals: self insert" on public.contact_reveals
  for insert with check (user_id = (select auth.uid()));
