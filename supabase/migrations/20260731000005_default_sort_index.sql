-- ---------------------------------------------------------------------------
-- M3: Index the actual default browse/search sort (2026-07-31 audit)
--
-- docs/blueprint/07-database-blueprint.md:46 specifies an index on
-- properties (approval_status, status, published_at desc) for "the approval
-- queue + freshness feeds," but the code's actual default sort — used by
-- listProperties(), searchProperties(), and listStudentProperties() any
-- time no explicit ?sort= is given, i.e. the most common case — orders by
-- `is_featured desc, published_at desc`, and additionally filters
-- `deleted_at is null` (added after the blueprint index was specified).
-- Neither the existing idx_properties_live nor the blueprint's own
-- suggestion actually covers this query shape. This index matches the real
-- predicate + sort combination in use.
-- ---------------------------------------------------------------------------

create index idx_properties_default_sort
  on public.properties (approval_status, status, is_featured desc, published_at desc)
  where deleted_at is null;
