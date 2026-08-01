-- ---------------------------------------------------------------------------
-- H9: Prevent hard-delete of listings at the RLS layer (2026-07-31 audit)
--
-- "properties: dealer delete own" let the owning seller issue a real
-- DELETE against `properties`, even though the application always
-- soft-deletes (deleteProperty() in
-- src/features/properties/server/mutations.ts sets deleted_at + status,
-- never calls .delete()) and the product's documented policy is
-- archive-only, never hard-delete. Confirmed no application code calls
-- .delete() on `properties`, so removing this policy is safe — sellers keep
-- full soft-delete/update access via "properties: dealer update own".
-- Admins retain delete access via "properties: admin all" (and via the
-- service-role client, which bypasses RLS entirely).
-- ---------------------------------------------------------------------------

drop policy if exists "properties: dealer delete own" on public.properties;
