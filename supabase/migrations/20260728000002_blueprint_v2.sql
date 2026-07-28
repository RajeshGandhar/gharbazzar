-- ============================================================================
-- Schema v2 — Approved Startup Blueprint (docs/blueprint/07-database-blueprint.md)
-- Applies on top of 20260728000001 on a fresh database (no deployed DB exists;
-- the pair is the canonical initial schema).
-- Contents: seller model (4 types), regions, universities + computed distances,
-- room-level student inventory, retention/analytics spine, T&S + ops tables, seeds.
-- ============================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- 1. NEW ENUMS
-- ---------------------------------------------------------------------------
create type seller_type        as enum ('owner', 'agent', 'builder', 'property_manager');
create type institution_type   as enum ('university', 'college', 'coaching_hub', 'school');
create type rental_kind        as enum ('standard', 'student');
create type gender_policy      as enum ('any', 'boys_only', 'girls_only', 'family_only');
create type meal_plan          as enum ('none', 'breakfast_only', 'two_meals', 'three_meals');
create type mess_type          as enum ('veg', 'veg_nonveg');
create type alert_frequency    as enum ('instant', 'daily', 'off');
create type outbox_channel     as enum ('in_app', 'email', 'whatsapp', 'sms');
create type outbox_status      as enum ('pending', 'sent', 'failed', 'cancelled');
create type media_job_type     as enum ('thumbnail', 'compress', 'exif_strip', 'watermark');
create type job_status         as enum ('queued', 'processing', 'done', 'failed');
create type verification_level as enum ('l1_identity', 'l2_property', 'l3_trusted');
create type verification_status as enum ('pending', 'approved', 'rejected', 'expired');
create type ticket_status      as enum ('open', 'pending_user', 'resolved', 'closed');
create type ticket_priority    as enum ('low', 'normal', 'high', 'urgent');
create type listing_event_type as enum ('view', 'gallery_open', 'reveal', 'whatsapp_click', 'call_click', 'share', 'favorite', 'visit_request');
create type onboarding_stage   as enum ('identified', 'visited', 'onboarded', 'active');
create type plan_type          as enum ('subscription', 'one_time');
create type plan_audience      as enum ('agent', 'owner', 'operator');

-- ---------------------------------------------------------------------------
-- 2. SELLER MODEL (dealers → sellers, role dealer → seller)
-- ---------------------------------------------------------------------------
alter type user_role rename value 'dealer' to 'seller';

alter table public.dealers rename to sellers;
alter table public.sellers rename column agency_name to business_name;
alter table public.sellers alter column business_name drop not null;
alter table public.sellers add column seller_type seller_type not null default 'agent';

alter table public.properties         rename column dealer_id to seller_id;
alter table public.kyc_documents      rename column dealer_id to seller_id;
alter table public.subscriptions      rename column dealer_id to seller_id;
alter table public.payments           rename column dealer_id to seller_id;
alter table public.reviews            rename column dealer_id to seller_id;
alter table public.inquiries          rename column dealer_id to seller_id;
alter table public.visit_appointments rename column dealer_id to seller_id;
alter table public.conversations      rename column dealer_id to seller_id;

-- is_dealer → is_seller (recreate dependent policy first)
create or replace function public.is_seller()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'seller' and is_active
  );
$$;

drop policy "properties: dealer insert" on public.properties;
create policy "properties: seller insert" on public.properties for insert
  with check (seller_id = (select auth.uid()) and public.is_seller());
drop function public.is_dealer();

-- Function bodies are stored text: recreate the two that referenced old names.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  meta_role   text := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  meta_seller text := new.raw_user_meta_data ->> 'seller_type';
  safe_role   user_role;
  safe_seller seller_type;
begin
  if meta_role in ('seller', 'dealer') or meta_seller is not null then
    safe_role := 'seller';
  else
    safe_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, email, phone, avatar_url)
  values (
    new.id,
    safe_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  if safe_role = 'seller' then
    if meta_seller in ('owner', 'agent', 'builder', 'property_manager') then
      safe_seller := meta_seller::seller_type;
    else
      safe_seller := 'owner';                -- least-privileged default
    end if;

    insert into public.sellers (id, seller_type, business_name, slug)
    values (
      new.id,
      safe_seller,
      nullif(new.raw_user_meta_data ->> 'business_name', ''),
      new.id::text                           -- temporary unique slug; replaced on profile completion
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.sync_dealer_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s uuid := coalesce(new.seller_id, old.seller_id);
begin
  update public.sellers set
    avg_rating    = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where seller_id = s and status = 'approved'), 0),
    total_reviews = (select count(*) from public.reviews where seller_id = s and status = 'approved')
  where id = s;
  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. GEOGRAPHY: REGIONS
-- ---------------------------------------------------------------------------
create table public.regions (
  id        bigint generated always as identity primary key,
  name      text not null,
  slug      text not null unique,
  is_active boolean not null default true,
  position  int not null default 0
);

alter table public.cities add column region_id bigint references public.regions(id) on delete set null;
create index idx_cities_region on public.cities (region_id);

-- ---------------------------------------------------------------------------
-- 4. UNIVERSITY ECOSYSTEM
-- ---------------------------------------------------------------------------
create table public.universities (
  id               bigint generated always as identity primary key,
  name             text not null,
  slug             text not null unique,
  aliases          text[] not null default '{}',
  institution_type institution_type not null default 'university',
  city_id          bigint not null references public.cities(id) on delete cascade,
  address          text,
  latitude         double precision,
  longitude        double precision,
  location         geography(point, 4326) generated always as (
                     case when latitude is not null and longitude is not null
                       then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
                     end
                   ) stored,
  logo_url         text,
  website          text,
  is_active        boolean not null default true,
  seo_title        text,
  seo_description  text,
  created_at       timestamptz not null default now()
);
create index idx_universities_city     on public.universities (city_id);
create index idx_universities_location on public.universities using gist (location);
create index idx_universities_trgm     on public.universities using gin (name gin_trgm_ops);

create table public.property_universities (
  property_id         uuid   not null references public.properties(id) on delete cascade,
  university_id       bigint not null references public.universities(id) on delete cascade,
  computed_distance_m integer,                -- ALWAYS trigger-computed; never user input
  created_at          timestamptz not null default now(),
  primary key (property_id, university_id)
);
create index idx_property_universities_university on public.property_universities (university_id, computed_distance_m);

create or replace function public.compute_university_distance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select st_distance(p.location, u.location)::integer
    into new.computed_distance_m
  from public.properties p, public.universities u
  where p.id = new.property_id and u.id = new.university_id
    and p.location is not null and u.location is not null;
  return new;
end;
$$;

create trigger trg_compute_university_distance
  before insert or update on public.property_universities
  for each row execute function public.compute_university_distance();

-- Re-compute link distances when a property's geo-pin moves
create or replace function public.recompute_property_university_distances()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.property_universities pu
  set computed_distance_m = st_distance(
        (select location from public.properties where id = pu.property_id),
        (select location from public.universities where id = pu.university_id))::integer
  where pu.property_id = new.id;
  return new;
end;
$$;

create trigger trg_recompute_university_distances
  after update of latitude, longitude on public.properties
  for each row execute function public.recompute_property_university_distances();

-- ---------------------------------------------------------------------------
-- 5. STUDENT HOUSING: ROOM-LEVEL INVENTORY + LISTING FIELDS
-- ---------------------------------------------------------------------------
create table public.room_types (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references public.properties(id) on delete cascade,
  name                 text,
  sharing_count        smallint not null check (sharing_count between 1 and 6),  -- 1 = private
  monthly_rent_per_bed numeric(10,2) not null check (monthly_rent_per_bed >= 0),
  security_deposit     numeric(10,2),
  is_ac                boolean not null default false,
  meal_plan            meal_plan not null default 'none',
  attached_bathroom    boolean not null default false,
  total_beds           smallint check (total_beds >= 0),
  available_beds       smallint not null default 0 check (available_beds >= 0),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index idx_room_types_property on public.room_types (property_id) where is_active;
create trigger trg_room_types_updated_at before update on public.room_types for each row execute function public.set_updated_at();

alter table public.properties
  add column rental_kind       rental_kind,
  add column gender_policy     gender_policy not null default 'any',
  add column preferred_tenants text[] not null default '{}',
  add column available_from    date,
  add column lock_in_months    smallint,
  add column curfew_time       time,
  add column has_warden        boolean,
  add column mess_type         mess_type,
  add column quality_score     smallint not null default 0 check (quality_score between 0 and 100),
  add column risk_score        smallint not null default 0 check (risk_score between 0 and 100),
  add column deleted_at        timestamptz;

create index idx_properties_money   on public.properties (city_id, purpose, property_type_id, price);
create index idx_properties_student on public.properties (city_id, purpose) where rental_kind = 'student';

-- ---------------------------------------------------------------------------
-- 6. IDENTITY HARDENING
-- ---------------------------------------------------------------------------
alter table public.profiles alter column email type citext;
alter table public.profiles add constraint profiles_phone_unique unique (phone);
alter table public.profiles add column phone_verified_at timestamptz;

alter table public.reviews add column lead_id uuid references public.inquiries(id) on delete set null;

alter table public.subscription_plans
  add column plan_type plan_type not null default 'subscription',
  add column audience  plan_audience not null default 'agent';

-- ---------------------------------------------------------------------------
-- 7. RETENTION & ANALYTICS SPINE
-- ---------------------------------------------------------------------------
create table public.saved_searches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  purpose         listing_purpose,
  filters         jsonb not null default '{}'::jsonb,
  frequency       alert_frequency not null default 'instant',
  email_alerts    boolean not null default true,
  last_alerted_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_saved_searches_user    on public.saved_searches (user_id);
create index idx_saved_searches_filters on public.saved_searches using gin (filters);
create trigger trg_saved_searches_updated_at before update on public.saved_searches for each row execute function public.set_updated_at();

create table public.listing_events (
  id          bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  session_id  uuid,
  event_type  listing_event_type not null,
  source      text,
  created_at  timestamptz not null default now()
);
create index idx_listing_events_property on public.listing_events (property_id, event_type);
create index idx_listing_events_time     on public.listing_events using brin (created_at);

create table public.search_events (
  id           bigint generated always as identity primary key,
  user_id      uuid references public.profiles(id) on delete set null,
  session_id   uuid,
  purpose      listing_purpose,
  city_id      bigint references public.cities(id) on delete set null,
  area_id      bigint references public.areas(id) on delete set null,
  filters      jsonb not null default '{}'::jsonb,
  result_count int not null default 0,
  zero_results boolean generated always as (result_count = 0) stored,
  created_at   timestamptz not null default now()
);
create index idx_search_events_city on public.search_events (city_id, created_at desc);
create index idx_search_events_zero on public.search_events (zero_results) where zero_results;
create index idx_search_events_time on public.search_events using brin (created_at);

create table public.contact_reveals (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  seller_id   uuid not null references public.sellers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index idx_contact_reveals_seller on public.contact_reveals (seller_id, created_at desc);

create table public.price_history (
  id          bigint generated always as identity primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  old_price   numeric(14,2),
  new_price   numeric(14,2) not null,
  changed_at  timestamptz not null default now()
);
create index idx_price_history_property on public.price_history (property_id, changed_at desc);

create or replace function public.log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.price is distinct from old.price then
    insert into public.price_history (property_id, old_price, new_price)
    values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;
create trigger trg_log_price_change after update of price on public.properties
  for each row execute function public.log_price_change();

create table public.property_slugs (
  old_slug    text primary key,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function public.log_slug_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.slug is distinct from old.slug then
    insert into public.property_slugs (old_slug, property_id)
    values (old.slug, new.id)
    on conflict (old_slug) do update set property_id = excluded.property_id;
  end if;
  return new;
end;
$$;
create trigger trg_log_slug_change after update of slug on public.properties
  for each row execute function public.log_slug_change();

-- ---------------------------------------------------------------------------
-- 8. DELIVERY & PIPELINE INFRASTRUCTURE
-- ---------------------------------------------------------------------------
create table public.notification_outbox (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  channel       outbox_channel not null,
  template      text not null,
  payload       jsonb not null default '{}'::jsonb,
  status        outbox_status not null default 'pending',
  attempts      int not null default 0,
  next_retry_at timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_outbox_pending on public.notification_outbox (status, next_retry_at) where status = 'pending';

create table public.media_jobs (
  id         uuid primary key default gen_random_uuid(),
  bucket     text not null,
  path       text not null,
  job        media_job_type not null,
  status     job_status not null default 'queued',
  attempts   int not null default 0,
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_media_jobs_queued on public.media_jobs (status) where status = 'queued';
create trigger trg_media_jobs_updated_at before update on public.media_jobs for each row execute function public.set_updated_at();

create table public.webhook_events (
  id           bigint generated always as identity primary key,
  provider     text not null,
  event_id     text not null,
  payload      jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, event_id)
);

-- ---------------------------------------------------------------------------
-- 9. TRUST & SAFETY / OPS
-- ---------------------------------------------------------------------------
create table public.verification_requests (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid references public.sellers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  level       verification_level not null,
  status      verification_status not null default 'pending',
  evidence    jsonb not null default '[]'::jsonb,     -- storage paths + notes
  reviewer_id uuid references public.profiles(id) on delete set null,
  reason      text,
  reviewed_at timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  check (seller_id is not null or property_id is not null)
);
create index idx_verification_requests_status on public.verification_requests (status, created_at);

create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  requester_id      uuid references public.profiles(id) on delete set null,
  contact_name      text,
  contact_phone     text,
  contact_email     text,
  channel           text not null default 'in_app',     -- in_app | whatsapp | email
  category          text not null default 'general',
  priority          ticket_priority not null default 'normal',
  status            ticket_status not null default 'open',
  assignee_id       uuid references public.profiles(id) on delete set null,
  subject           text not null,
  first_response_at timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_support_tickets_queue on public.support_tickets (status, priority, created_at);
create trigger trg_support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();

create table public.ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  is_internal boolean not null default false,          -- internal ops notes, hidden from requester
  body        text not null,
  created_at  timestamptz not null default now()
);
create index idx_ticket_messages_ticket on public.ticket_messages (ticket_id, created_at);

create table public.strikes (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reason_code text not null,
  details     text,
  evidence    jsonb not null default '{}'::jsonb,
  issued_by   uuid references public.profiles(id) on delete set null,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_strikes_user on public.strikes (user_id, created_at desc);

create table public.blocked_identifiers (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('phone', 'email', 'device', 'ip')),
  value_hash text not null,
  reason     text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, value_hash)
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index idx_user_blocks_blocked on public.user_blocks (blocked_id);

create table public.seller_onboarding (
  id             uuid primary key default gen_random_uuid(),
  prospect_name  text not null,
  prospect_phone text not null unique,                 -- pipeline dedupe by phone
  seller_type    seller_type not null default 'agent',
  city_id        bigint references public.cities(id) on delete set null,
  locality_note  text,
  stage          onboarding_stage not null default 'identified',
  assignee_id    uuid references public.profiles(id) on delete set null,
  notes          text,
  next_action_at timestamptz,
  seller_id      uuid references public.sellers(id) on delete set null,   -- linked once converted
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_seller_onboarding_pipeline on public.seller_onboarding (stage, assignee_id, next_action_at);
create trigger trg_seller_onboarding_updated_at before update on public.seller_onboarding for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY — NEW TABLES
-- ---------------------------------------------------------------------------
alter table public.regions                enable row level security;
alter table public.universities           enable row level security;
alter table public.property_universities  enable row level security;
alter table public.room_types             enable row level security;
alter table public.saved_searches         enable row level security;
alter table public.listing_events         enable row level security;
alter table public.search_events          enable row level security;
alter table public.contact_reveals        enable row level security;
alter table public.price_history          enable row level security;
alter table public.property_slugs         enable row level security;
alter table public.notification_outbox    enable row level security;
alter table public.media_jobs             enable row level security;
alter table public.webhook_events         enable row level security;
alter table public.verification_requests  enable row level security;
alter table public.support_tickets        enable row level security;
alter table public.ticket_messages        enable row level security;
alter table public.strikes                enable row level security;
alter table public.blocked_identifiers    enable row level security;
alter table public.user_blocks            enable row level security;
alter table public.seller_onboarding      enable row level security;

-- geography & institutions: public read, admin write
create policy "regions: public read"      on public.regions      for select using (is_active or public.is_admin());
create policy "regions: admin write"      on public.regions      for all    using (public.is_admin());
create policy "universities: public read" on public.universities for select using (is_active or public.is_admin());
create policy "universities: admin write" on public.universities for all    using (public.is_admin());

-- property children: visible with parent; writable by owning seller/admin
create policy "property_universities: read" on public.property_universities for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "property_universities: seller write" on public.property_universities for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.seller_id = (select auth.uid()) or public.is_admin())));
create policy "room_types: read" on public.room_types for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "room_types: seller write" on public.room_types for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.seller_id = (select auth.uid()) or public.is_admin())));

-- retention: strictly own
create policy "saved_searches: own" on public.saved_searches for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- analytics: service-role writes only; admin reads; sellers see aggregates via API views
create policy "listing_events: admin read" on public.listing_events for select using (public.is_admin());
create policy "search_events: admin read"  on public.search_events  for select using (public.is_admin());

-- reveals: seeker sees own, seller sees own inbound; insert via service role only
create policy "contact_reveals: participants read" on public.contact_reveals for select
  using (user_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());

-- price history: public where parent is visible (trust feature); writes via trigger
create policy "price_history: read with parent" on public.price_history for select
  using (exists (select 1 from public.properties p where p.id = property_id));

-- slug history: public read (server resolves 301s)
create policy "property_slugs: public read" on public.property_slugs for select using (true);

-- infrastructure: admin only (service role bypasses)
create policy "outbox: admin read"        on public.notification_outbox for select using (public.is_admin());
create policy "media_jobs: admin read"    on public.media_jobs         for select using (public.is_admin());
create policy "webhook_events: admin read" on public.webhook_events    for select using (public.is_admin());

-- verification: seller manages own requests; admin reviews
create policy "verification: own read"   on public.verification_requests for select
  using (seller_id = (select auth.uid()) or public.is_admin());
create policy "verification: own insert" on public.verification_requests for insert
  with check (seller_id = (select auth.uid()));
create policy "verification: admin update" on public.verification_requests for update using (public.is_admin());

-- support: requester + admin; internal notes hidden from requester
create policy "tickets: own read"    on public.support_tickets for select
  using (requester_id = (select auth.uid()) or public.is_admin());
create policy "tickets: own insert"  on public.support_tickets for insert
  with check (requester_id = (select auth.uid()) or requester_id is null);
create policy "tickets: admin update" on public.support_tickets for update using (public.is_admin());
create policy "ticket_messages: participant read" on public.ticket_messages for select
  using (
    public.is_admin()
    or (is_internal = false and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.requester_id = (select auth.uid())
    ))
  );
create policy "ticket_messages: participant insert" on public.ticket_messages for insert
  with check (
    (public.is_admin())
    or (is_internal = false and author_id = (select auth.uid()) and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.requester_id = (select auth.uid())
    ))
  );

-- enforcement: user sees own strikes; the rest is admin/service territory
create policy "strikes: own read"          on public.strikes             for select using (user_id = (select auth.uid()) or public.is_admin());
create policy "strikes: admin write"       on public.strikes             for insert with check (public.is_admin());
create policy "blocked_identifiers: admin" on public.blocked_identifiers for all    using (public.is_admin());
create policy "user_blocks: own"           on public.user_blocks         for all
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

-- field CRM: ops/admin only
create policy "seller_onboarding: admin" on public.seller_onboarding for all using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 11. SEEDS — regions, NCR cities, student-cluster areas, institutions
--     (master data; coordinates are starting values, ops-verified per 14§3)
-- ---------------------------------------------------------------------------
insert into public.regions (name, slug, position) values
  ('Braj',      'braj',      1),
  ('Delhi NCR', 'delhi-ncr', 2);

update public.cities set region_id = (select id from public.regions where slug = 'braj');

insert into public.cities (name, slug, district, state, latitude, longitude, region_id, seo_title, seo_description) values
  ('Delhi',         'delhi',         'Delhi',           'Delhi',         28.6139, 77.2090, (select id from public.regions where slug = 'delhi-ncr'), 'Student Housing in Delhi — PG, Hostels & Flats', 'PGs, hostels and student flats near Delhi University, coaching hubs and colleges across Delhi.'),
  ('Noida',         'noida',         'Gautam Buddh Nagar', 'Uttar Pradesh', 28.5355, 77.3910, (select id from public.regions where slug = 'delhi-ncr'), 'Student Housing in Noida — PG, Hostels & Flats', 'Verified PGs and student housing near Amity, JSS and Noida sector institutes.'),
  ('Greater Noida', 'greater-noida', 'Gautam Buddh Nagar', 'Uttar Pradesh', 28.4744, 77.5040, (select id from public.regions where slug = 'delhi-ncr'), 'Student Housing in Greater Noida — PG & Hostels', 'PGs and hostels near Sharda, Galgotias, Bennett, GBU and Knowledge Park campuses.'),
  ('Gurugram',      'gurugram',      'Gurugram',        'Haryana',       28.4595, 77.0266, (select id from public.regions where slug = 'delhi-ncr'), null, null),
  ('Ghaziabad',     'ghaziabad',     'Ghaziabad',       'Uttar Pradesh', 28.6692, 77.4538, (select id from public.regions where slug = 'delhi-ncr'), null, null),
  ('Faridabad',     'faridabad',     'Faridabad',       'Haryana',       28.4089, 77.3178, (select id from public.regions where slug = 'delhi-ncr'), null, null);

insert into public.areas (city_id, name, slug, pincode) values
  ((select id from public.cities where slug = 'delhi'),         'Mukherjee Nagar',    'mukherjee-nagar',    '110009'),
  ((select id from public.cities where slug = 'delhi'),         'Old Rajinder Nagar', 'old-rajinder-nagar', '110060'),
  ((select id from public.cities where slug = 'delhi'),         'GTB Nagar',          'gtb-nagar',          '110009'),
  ((select id from public.cities where slug = 'delhi'),         'Kamla Nagar',        'kamla-nagar',        '110007'),
  ((select id from public.cities where slug = 'delhi'),         'Hudson Lane',        'hudson-lane',        '110009'),
  ((select id from public.cities where slug = 'delhi'),         'Jamia Nagar',        'jamia-nagar',        '110025'),
  ((select id from public.cities where slug = 'delhi'),         'Satya Niketan',      'satya-niketan',      '110021'),
  ((select id from public.cities where slug = 'noida'),         'Sector 62',          'sector-62',          '201309'),
  ((select id from public.cities where slug = 'noida'),         'Sector 125',         'sector-125',         '201313'),
  ((select id from public.cities where slug = 'noida'),         'Sector 15',          'sector-15',          '201301'),
  ((select id from public.cities where slug = 'greater-noida'), 'Knowledge Park I',   'knowledge-park-1',   '201310'),
  ((select id from public.cities where slug = 'greater-noida'), 'Knowledge Park II',  'knowledge-park-2',   '201310'),
  ((select id from public.cities where slug = 'greater-noida'), 'Knowledge Park III', 'knowledge-park-3',   '201310'),
  ((select id from public.cities where slug = 'greater-noida'), 'Alpha 1',            'alpha-1',            '201310');

insert into public.universities (name, slug, aliases, institution_type, city_id, latitude, longitude) values
  ('GLA University',              'gla-university',        '{GLA,GLAU}',            'university',   (select id from public.cities where slug = 'mathura'),       27.6060, 77.5930),
  ('Sanskriti University',        'sanskriti-university',  '{Sanskriti}',           'university',   (select id from public.cities where slug = 'chhata'),        27.7150, 77.4850),
  ('BSA College',                 'bsa-college',           '{BSA}',                 'college',      (select id from public.cities where slug = 'mathura'),       27.5030, 77.6800),
  ('University of Delhi (North Campus)', 'du-north-campus', '{DU North,Delhi University}', 'university', (select id from public.cities where slug = 'delhi'),   28.6880, 77.2090),
  ('University of Delhi (South Campus)', 'du-south-campus', '{DU South}',           'university',   (select id from public.cities where slug = 'delhi'),         28.5890, 77.1670),
  ('Jawaharlal Nehru University', 'jnu',                   '{JNU}',                 'university',   (select id from public.cities where slug = 'delhi'),         28.5400, 77.1660),
  ('Jamia Millia Islamia',        'jamia-millia-islamia',  '{Jamia,JMI}',           'university',   (select id from public.cities where slug = 'delhi'),         28.5610, 77.2800),
  ('GGSIPU (Dwarka)',             'ggsipu',                '{IP University,IPU}',   'university',   (select id from public.cities where slug = 'delhi'),         28.5940, 77.0230),
  ('Amity University Noida',      'amity-university-noida', '{Amity}',              'university',   (select id from public.cities where slug = 'noida'),         28.5440, 77.3330),
  ('Sharda University',           'sharda-university',     '{Sharda}',              'university',   (select id from public.cities where slug = 'greater-noida'), 28.4730, 77.4840),
  ('Galgotias University',        'galgotias-university',  '{Galgotias}',           'university',   (select id from public.cities where slug = 'greater-noida'), 28.3660, 77.5410),
  ('Bennett University',          'bennett-university',    '{Bennett}',             'university',   (select id from public.cities where slug = 'greater-noida'), 28.4500, 77.5850),
  ('Gautam Buddha University',    'gautam-buddha-university', '{GBU}',              'university',   (select id from public.cities where slug = 'greater-noida'), 28.4210, 77.5220),
  ('Mukherjee Nagar Coaching Hub', 'mukherjee-nagar-coaching', '{Mukherjee Nagar UPSC}', 'coaching_hub', (select id from public.cities where slug = 'delhi'),   28.7070, 77.2070),
  ('Old Rajinder Nagar Coaching Hub', 'old-rajinder-nagar-coaching', '{ORN UPSC}',  'coaching_hub', (select id from public.cities where slug = 'delhi'),         28.6440, 77.1920);

insert into public.property_types (name, slug, category, position) values
  ('Hostel',      'hostel',      'residential', 14),
  ('Guest House', 'guest-house', 'residential', 15);
