-- ---------------------------------------------------------------------------
-- M2: Restrict increment_property_views to server-side callers only
-- (2026-07-31 audit)
--
-- The function's own comment says "called from the server on property page
-- views," but Supabase grants EXECUTE on new public-schema functions to
-- `anon`/`authenticated` by default, so it was directly callable by anyone
-- with the public anon key via PostgREST RPC — with no auth check and no
-- throttle, and it feeds directly into the `sort=popular` ranking. The
-- application itself has no current call site for it (confirmed: zero
-- `.rpc(` calls anywhere in src/), so revoking public execute access has
-- no impact on any working feature — it only closes public callability
-- ahead of that server-side integration being wired up.
-- ---------------------------------------------------------------------------

revoke execute on function public.increment_property_views(uuid) from anon, authenticated;
