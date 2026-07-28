-- ============================================================================
-- GharBazaar — Real Estate Marketplace (Mathura, India)
-- Initial schema: extensions, enums, tables, indexes, triggers, RLS, storage
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists postgis;        -- geo queries (nearby search, map search)
create extension if not exists pg_trgm;        -- fuzzy text search on locations/titles

-- ---------------------------------------------------------------------------
-- 2. ENUMS
-- ---------------------------------------------------------------------------
create type user_role            as enum ('super_admin', 'dealer', 'customer');
create type listing_purpose      as enum ('sale', 'rent', 'lease');
create type property_category    as enum ('residential', 'commercial', 'land', 'industrial', 'agricultural');
create type furnishing_status    as enum ('unfurnished', 'semi_furnished', 'fully_furnished');
create type facing_direction     as enum ('north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west');
create type construction_status  as enum ('ready_to_move', 'under_construction', 'new_launch');
create type ownership_type       as enum ('freehold', 'leasehold', 'co_operative_society', 'power_of_attorney');
create type property_status      as enum ('draft', 'active', 'sold', 'rented', 'inactive', 'expired');
create type approval_status      as enum ('pending', 'approved', 'rejected');
create type kyc_status           as enum ('not_submitted', 'submitted', 'verified', 'rejected');
create type media_kind           as enum ('upload', 'youtube');
create type inquiry_source       as enum ('form', 'whatsapp', 'call', 'chat');
create type inquiry_status       as enum ('new', 'contacted', 'visit_scheduled', 'negotiating', 'closed_won', 'closed_lost');
create type visit_status         as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type content_status       as enum ('pending', 'approved', 'rejected');
create type blog_status          as enum ('draft', 'published', 'archived');
create type subscription_status  as enum ('trialing', 'active', 'expired', 'cancelled');
create type payment_status       as enum ('created', 'pending', 'paid', 'failed', 'refunded');
create type report_status        as enum ('open', 'resolved', 'dismissed');
create type nearby_place_kind    as enum ('school', 'hospital', 'temple', 'market', 'metro', 'railway', 'bus_stop', 'park', 'bank', 'other');

-- ---------------------------------------------------------------------------
-- 3. CORE TABLES
-- ---------------------------------------------------------------------------

-- profiles: one row per auth user
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'customer',
  full_name    text not null default '',
  email        text,
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.cities (
  id              bigint generated always as identity primary key,
  name            text not null,
  slug            text not null unique,
  district        text not null,
  state           text not null,
  country         text not null default 'India',
  latitude        double precision,
  longitude       double precision,
  image_url       text,
  is_active       boolean not null default true,
  position        int not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now()
);

create table public.areas (
  id         bigint generated always as identity primary key,
  city_id    bigint not null references public.cities(id) on delete cascade,
  name       text not null,
  slug       text not null,
  pincode    text,
  latitude   double precision,
  longitude  double precision,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table public.property_types (
  id        bigint generated always as identity primary key,
  name      text not null,
  slug      text not null unique,
  category  property_category not null,
  icon      text,
  is_active boolean not null default true,
  position  int not null default 0
);

create table public.amenities (
  id        bigint generated always as identity primary key,
  name      text not null,
  slug      text not null unique,
  icon      text,
  is_active boolean not null default true
);

create table public.dealers (
  id               uuid primary key references public.profiles(id) on delete cascade,
  agency_name      text not null,
  slug             text not null unique,
  about            text,
  experience_years int,
  office_address   text,
  city_id          bigint references public.cities(id) on delete set null,
  whatsapp_number  text,
  website          text,
  logo_url         text,
  cover_image_url  text,
  rera_number      text,
  kyc_status       kyc_status not null default 'not_submitted',
  is_verified      boolean not null default false,
  verified_at      timestamptz,
  avg_rating       numeric(3,2) not null default 0,
  total_reviews    int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references public.dealers(id) on delete cascade,
  doc_type    text not null,               -- aadhaar | pan | gst | rera | shop_license
  file_path   text not null,               -- storage path in kyc-documents bucket
  status      content_status not null default 'pending',
  remarks     text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS & BILLING
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id             bigint generated always as identity primary key,
  name           text not null,
  slug           text not null unique,
  description    text,
  price          numeric(10,2) not null check (price >= 0),
  currency       text not null default 'INR',
  duration_days  int not null check (duration_days > 0),
  listing_limit  int not null default 0,     -- 0 = unlimited
  featured_limit int not null default 0,
  features       jsonb not null default '[]'::jsonb,
  is_active      boolean not null default true,
  position       int not null default 0,
  created_at     timestamptz not null default now()
);

create table public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  dealer_id     uuid not null references public.dealers(id) on delete cascade,
  plan_id       bigint not null references public.subscription_plans(id),
  status        subscription_status not null default 'active',
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  listings_used int not null default 0,
  featured_used int not null default 0,
  created_at    timestamptz not null default now()
);

create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  dealer_id          uuid not null references public.dealers(id) on delete cascade,
  subscription_id    uuid references public.subscriptions(id) on delete set null,
  amount             numeric(10,2) not null check (amount >= 0),
  currency           text not null default 'INR',
  gateway            text not null,          -- razorpay | stripe
  gateway_order_id   text,
  gateway_payment_id text,
  status             payment_status not null default 'created',
  meta               jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid not null references public.payments(id) on delete cascade,
  invoice_number text not null unique,
  pdf_path       text,                       -- storage path in invoices bucket
  issued_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. PROPERTIES
-- ---------------------------------------------------------------------------
create table public.properties (
  id                  uuid primary key default gen_random_uuid(),
  dealer_id           uuid not null references public.dealers(id) on delete cascade,
  title               text not null,
  slug                text not null unique,
  description         text not null default '',
  property_type_id    bigint not null references public.property_types(id),
  purpose             listing_purpose not null,
  price               numeric(14,2) not null check (price >= 0),
  price_per_sqft      numeric(12,2),
  is_negotiable       boolean not null default false,
  maintenance_charge  numeric(10,2),
  security_deposit    numeric(12,2),
  -- location
  address             text not null,
  landmark            text,
  city_id             bigint not null references public.cities(id),
  area_id             bigint references public.areas(id) on delete set null,
  state               text not null default 'Uttar Pradesh',
  country             text not null default 'India',
  pincode             text,
  latitude            double precision,
  longitude           double precision,
  location            geography(point, 4326) generated always as (
                        case when latitude is not null and longitude is not null
                          then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
                        end
                      ) stored,
  -- dimensions
  built_up_area       numeric(10,2),
  carpet_area         numeric(10,2),
  plot_area           numeric(12,2),
  area_unit           text not null default 'sqft',
  -- configuration
  bedrooms            smallint check (bedrooms between 0 and 50),
  bathrooms           smallint check (bathrooms between 0 and 50),
  balconies           smallint check (balconies between 0 and 50),
  kitchens            smallint check (kitchens between 0 and 20),
  floor_number        smallint,
  total_floors        smallint,
  parking_spaces      smallint not null default 0,
  facing              facing_direction,
  property_age_years  smallint,
  construction_status construction_status,
  possession_date     date,
  ownership           ownership_type,
  furnishing          furnishing_status,
  -- media / extras
  youtube_url         text,
  virtual_tour_url    text,
  brochure_path       text,
  -- lifecycle
  status              property_status not null default 'draft',
  approval_status     approval_status not null default 'pending',
  rejection_reason    text,
  approved_by         uuid references public.profiles(id) on delete set null,
  approved_at         timestamptz,
  is_featured         boolean not null default false,
  is_premium          boolean not null default false,
  is_sponsored        boolean not null default false,
  featured_until      timestamptz,
  -- counters (maintained by triggers / RPCs)
  views_count         bigint not null default 0,
  favorites_count     int not null default 0,
  inquiries_count     int not null default 0,
  -- seo
  seo_title           text,
  seo_description     text,
  og_image_url        text,
  -- full-text search
  fts                 tsvector generated always as (
                        to_tsvector('english',
                          coalesce(title, '') || ' ' || coalesce(description, '') || ' ' ||
                          coalesce(address, '') || ' ' || coalesce(landmark, ''))
                      ) stored,
  published_at        timestamptz,
  expires_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.property_images (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  path           text not null,              -- storage path in property-images bucket
  thumbnail_path text,
  alt_text       text,
  position       int not null default 0,
  is_cover       boolean not null default false,
  width          int,
  height         int,
  size_bytes     bigint,
  created_at     timestamptz not null default now()
);

create table public.property_videos (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  kind           media_kind not null default 'upload',
  url            text not null,              -- storage path or youtube url
  thumbnail_path text,
  position       int not null default 0,
  created_at     timestamptz not null default now()
);

create table public.property_documents (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name        text not null,
  doc_type    text not null,                 -- brochure | floor_plan | legal | other
  file_path   text not null,                 -- storage path in property-documents bucket
  created_at  timestamptz not null default now()
);

create table public.property_amenities (
  property_id uuid   not null references public.properties(id) on delete cascade,
  amenity_id  bigint not null references public.amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table public.nearby_places (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  kind        nearby_place_kind not null,
  name        text not null,
  distance_km numeric(6,2)
);

-- ---------------------------------------------------------------------------
-- 6. CUSTOMER ACTIVITY
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table public.recently_viewed (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table public.comparisons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  property_ids uuid[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references public.dealers(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  comment     text not null,
  status      content_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (dealer_id, author_id, property_id)
);

-- ---------------------------------------------------------------------------
-- 7. LEADS, VISITS, CHAT
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  dealer_id   uuid not null references public.dealers(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  name        text not null,
  email       text,
  phone       text not null,
  message     text,
  source      inquiry_source not null default 'form',
  status      inquiry_status not null default 'new',
  notes       text,                          -- dealer's private notes
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.visit_appointments (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  dealer_id    uuid not null references public.dealers(id) on delete cascade,
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  status       visit_status not null default 'requested',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  dealer_id       uuid not null references public.dealers(id) on delete cascade,
  customer_id     uuid not null references public.profiles(id) on delete cascade,
  property_id     uuid references public.properties(id) on delete set null,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  unique (dealer_id, customer_id, property_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,                  -- property_approved | new_inquiry | new_message | ...
  title      text not null,
  body       text,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. CONTENT (BLOG, PAGES)
-- ---------------------------------------------------------------------------
create table public.blog_categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text not null unique,
  description text
);

create table public.blogs (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references public.profiles(id) on delete set null,
  category_id     bigint references public.blog_categories(id) on delete set null,
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text not null default '',
  cover_image_url text,
  tags            text[] not null default '{}',
  status          blog_status not null default 'draft',
  views_count     bigint not null default 0,
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.blog_comments (
  id         uuid primary key default gen_random_uuid(),
  blog_id    uuid not null references public.blogs(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  status     content_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. MODERATION, SUPPORT, SITE
-- ---------------------------------------------------------------------------
create table public.property_reports (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  details     text,
  status      report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.banners (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  image_path text not null,
  link_url   text,
  slot       text not null,                  -- home_hero | home_middle | listing_sidebar | ...
  position   int not null default 0,
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role_label text,                           -- e.g. "Home Buyer, Vrindavan"
  avatar_url text,
  quote      text not null,
  rating     smallint check (rating between 1 and 5),
  is_active  boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create table public.faqs (
  id        bigint generated always as identity primary key,
  question  text not null,
  answer    text not null,
  category  text,
  position  int not null default 0,
  is_active boolean not null default true
);

create table public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10. LOGS
-- ---------------------------------------------------------------------------
create table public.activity_logs (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,                 -- login | property_created | ...
  entity_type text,
  entity_id   text,
  meta        jsonb not null default '{}'::jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,                 -- approve_property | ban_user | ...
  entity_type text not null,
  entity_id   text not null,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 11. HELPER FUNCTIONS
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'super_admin' and is_active
  );
$$;

create or replace function public.is_dealer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'dealer' and is_active
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create a profile (and dealer row if applicable) when an auth user signs up.
-- Role comes from signup metadata but may never be super_admin from the client.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  safe_role user_role;
begin
  if meta_role = 'dealer' then
    safe_role := 'dealer';
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

  if safe_role = 'dealer' then
    insert into public.dealers (id, agency_name, slug)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'agency_name', ''), 'Agency'),
      new.id::text                       -- temporary unique slug; replaced on profile completion
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Maintain properties.favorites_count
create or replace function public.sync_favorites_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.properties set favorites_count = favorites_count + 1 where id = new.property_id;
  elsif tg_op = 'DELETE' then
    update public.properties set favorites_count = greatest(favorites_count - 1, 0) where id = old.property_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_favorites_count
  after insert or delete on public.favorites
  for each row execute function public.sync_favorites_count();

-- Maintain dealers.avg_rating / total_reviews from approved reviews
create or replace function public.sync_dealer_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d uuid := coalesce(new.dealer_id, old.dealer_id);
begin
  update public.dealers set
    avg_rating    = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where dealer_id = d and status = 'approved'), 0),
    total_reviews = (select count(*) from public.reviews where dealer_id = d and status = 'approved')
  where id = d;
  return coalesce(new, old);
end;
$$;

create trigger trg_dealer_rating
  after insert or update of status, rating or delete on public.reviews
  for each row execute function public.sync_dealer_rating();

-- Maintain properties.inquiries_count
create or replace function public.sync_inquiries_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.property_id is not null then
    update public.properties set inquiries_count = inquiries_count + 1 where id = new.property_id;
  end if;
  return new;
end;
$$;

create trigger trg_inquiries_count
  after insert on public.inquiries
  for each row execute function public.sync_inquiries_count();

-- Atomic view counter (called from the server on property page views)
create or replace function public.increment_property_views(p_property_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.properties set views_count = views_count + 1 where id = p_property_id;
$$;

-- Nearby search (RLS still applies: security invoker)
create or replace function public.nearby_properties(p_lat double precision, p_lng double precision, p_radius_m int default 5000)
returns setof public.properties
language sql stable
as $$
  select *
  from public.properties
  where location is not null
    and st_dwithin(location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_m)
  order by location <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography;
$$;

-- updated_at triggers
create trigger trg_profiles_updated_at      before update on public.profiles           for each row execute function public.set_updated_at();
create trigger trg_dealers_updated_at       before update on public.dealers            for each row execute function public.set_updated_at();
create trigger trg_properties_updated_at    before update on public.properties         for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at      before update on public.payments           for each row execute function public.set_updated_at();
create trigger trg_inquiries_updated_at     before update on public.inquiries          for each row execute function public.set_updated_at();
create trigger trg_visits_updated_at        before update on public.visit_appointments for each row execute function public.set_updated_at();
create trigger trg_comparisons_updated_at   before update on public.comparisons        for each row execute function public.set_updated_at();
create trigger trg_blogs_updated_at         before update on public.blogs              for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. INDEXES
-- ---------------------------------------------------------------------------
create index idx_profiles_role             on public.profiles (role);
create index idx_areas_city                on public.areas (city_id);
create index idx_dealers_city              on public.dealers (city_id);
create index idx_dealers_verified          on public.dealers (is_verified) where is_verified;
create index idx_properties_dealer         on public.properties (dealer_id);
create index idx_properties_city           on public.properties (city_id);
create index idx_properties_area           on public.properties (area_id);
create index idx_properties_type           on public.properties (property_type_id);
create index idx_properties_purpose        on public.properties (purpose);
create index idx_properties_price          on public.properties (price);
create index idx_properties_live           on public.properties (approval_status, status) where approval_status = 'approved' and status = 'active';
create index idx_properties_featured       on public.properties (is_featured) where is_featured;
create index idx_properties_created        on public.properties (created_at desc);
create index idx_properties_fts            on public.properties using gin (fts);
create index idx_properties_location       on public.properties using gist (location);
create index idx_properties_beds_baths     on public.properties (bedrooms, bathrooms);
create index idx_property_images_property  on public.property_images (property_id, position);
create index idx_property_videos_property  on public.property_videos (property_id);
create index idx_property_docs_property    on public.property_documents (property_id);
create index idx_nearby_property           on public.nearby_places (property_id);
create index idx_favorites_property        on public.favorites (property_id);
create index idx_recently_viewed_user      on public.recently_viewed (user_id, viewed_at desc);
create index idx_reviews_dealer            on public.reviews (dealer_id, status);
create index idx_inquiries_dealer          on public.inquiries (dealer_id, status, created_at desc);
create index idx_inquiries_customer        on public.inquiries (customer_id);
create index idx_visits_dealer             on public.visit_appointments (dealer_id, scheduled_at);
create index idx_visits_customer           on public.visit_appointments (customer_id);
create index idx_conversations_dealer      on public.conversations (dealer_id, last_message_at desc);
create index idx_conversations_customer    on public.conversations (customer_id, last_message_at desc);
create index idx_messages_conversation     on public.messages (conversation_id, created_at);
create index idx_notifications_user       on public.notifications (user_id, created_at desc) ;
create index idx_notifications_unread      on public.notifications (user_id) where read_at is null;
create index idx_subscriptions_dealer      on public.subscriptions (dealer_id, status);
create index idx_payments_dealer           on public.payments (dealer_id, created_at desc);
create index idx_blogs_status              on public.blogs (status, published_at desc);
create index idx_blog_comments_blog        on public.blog_comments (blog_id, status);
create index idx_reports_status            on public.property_reports (status, created_at desc);
create index idx_activity_logs_user        on public.activity_logs (user_id, created_at desc);
create index idx_audit_logs_actor          on public.audit_logs (actor_id, created_at desc);
create index idx_cities_trgm               on public.cities using gin (name gin_trgm_ops);
create index idx_areas_trgm                on public.areas using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.cities                 enable row level security;
alter table public.areas                  enable row level security;
alter table public.property_types         enable row level security;
alter table public.amenities              enable row level security;
alter table public.dealers                enable row level security;
alter table public.kyc_documents          enable row level security;
alter table public.subscription_plans     enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.payments               enable row level security;
alter table public.invoices               enable row level security;
alter table public.properties             enable row level security;
alter table public.property_images        enable row level security;
alter table public.property_videos        enable row level security;
alter table public.property_documents     enable row level security;
alter table public.property_amenities     enable row level security;
alter table public.nearby_places          enable row level security;
alter table public.favorites              enable row level security;
alter table public.recently_viewed        enable row level security;
alter table public.comparisons            enable row level security;
alter table public.reviews                enable row level security;
alter table public.inquiries              enable row level security;
alter table public.visit_appointments     enable row level security;
alter table public.conversations          enable row level security;
alter table public.messages               enable row level security;
alter table public.notifications          enable row level security;
alter table public.blog_categories        enable row level security;
alter table public.blogs                  enable row level security;
alter table public.blog_comments          enable row level security;
alter table public.property_reports       enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.banners                enable row level security;
alter table public.testimonials           enable row level security;
alter table public.faqs                   enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings          enable row level security;
alter table public.activity_logs          enable row level security;
alter table public.audit_logs             enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles for select
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own" on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid()))); -- role changes only via admin/service
create policy "profiles: admin update" on public.profiles for update
  using (public.is_admin());

-- master data: public read (active rows), admin write
create policy "cities: public read"          on public.cities          for select using (is_active or public.is_admin());
create policy "cities: admin write"          on public.cities          for all    using (public.is_admin());
create policy "areas: public read"           on public.areas           for select using (is_active or public.is_admin());
create policy "areas: admin write"           on public.areas           for all    using (public.is_admin());
create policy "property_types: public read"  on public.property_types  for select using (is_active or public.is_admin());
create policy "property_types: admin write"  on public.property_types  for all    using (public.is_admin());
create policy "amenities: public read"       on public.amenities       for select using (is_active or public.is_admin());
create policy "amenities: admin write"       on public.amenities       for all    using (public.is_admin());

-- dealers: public profile info is readable (needed on property pages); own row + admin writable
create policy "dealers: public read"  on public.dealers for select using (true);
create policy "dealers: update own"   on public.dealers for update using (id = (select auth.uid()));
create policy "dealers: admin all"    on public.dealers for all    using (public.is_admin());

-- kyc: strictly dealer-own + admin
create policy "kyc: dealer own read"   on public.kyc_documents for select using (dealer_id = (select auth.uid()) or public.is_admin());
create policy "kyc: dealer own insert" on public.kyc_documents for insert with check (dealer_id = (select auth.uid()));
create policy "kyc: admin update"      on public.kyc_documents for update using (public.is_admin());

-- plans public read; subscriptions/payments/invoices: own dealer or admin (writes via service role)
create policy "plans: public read"        on public.subscription_plans for select using (is_active or public.is_admin());
create policy "plans: admin write"        on public.subscription_plans for all    using (public.is_admin());
create policy "subscriptions: own read"   on public.subscriptions      for select using (dealer_id = (select auth.uid()) or public.is_admin());
create policy "payments: own read"        on public.payments           for select using (dealer_id = (select auth.uid()) or public.is_admin());
create policy "invoices: own read"        on public.invoices           for select
  using (exists (select 1 from public.payments p where p.id = payment_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));

-- properties: world reads approved+active; dealer reads/writes own; admin all
create policy "properties: public read live" on public.properties for select
  using ((approval_status = 'approved' and status = 'active') or dealer_id = (select auth.uid()) or public.is_admin());
create policy "properties: dealer insert" on public.properties for insert
  with check (dealer_id = (select auth.uid()) and public.is_dealer());
create policy "properties: dealer update own" on public.properties for update
  using (dealer_id = (select auth.uid()));
create policy "properties: dealer delete own" on public.properties for delete
  using (dealer_id = (select auth.uid()));
create policy "properties: admin all" on public.properties for all using (public.is_admin());

-- property child tables: visible if parent visible; writable if parent owned
create policy "property_images: read" on public.property_images for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "property_images: dealer write" on public.property_images for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));
create policy "property_videos: read" on public.property_videos for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "property_videos: dealer write" on public.property_videos for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));
create policy "property_documents: read" on public.property_documents for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "property_documents: dealer write" on public.property_documents for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));
create policy "property_amenities: read" on public.property_amenities for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "property_amenities: dealer write" on public.property_amenities for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));
create policy "nearby_places: read" on public.nearby_places for select
  using (exists (select 1 from public.properties p where p.id = property_id));
create policy "nearby_places: dealer write" on public.nearby_places for all
  using (exists (select 1 from public.properties p where p.id = property_id and (p.dealer_id = (select auth.uid()) or public.is_admin())));

-- customer activity: strictly own
create policy "favorites: own"       on public.favorites       for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recently_viewed: own" on public.recently_viewed for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "comparisons: own"     on public.comparisons     for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- reviews: world reads approved; author manages own; admin moderates
create policy "reviews: read approved" on public.reviews for select
  using (status = 'approved' or author_id = (select auth.uid()) or public.is_admin());
create policy "reviews: insert own" on public.reviews for insert
  with check (author_id = (select auth.uid()));
create policy "reviews: update own pending" on public.reviews for update
  using (author_id = (select auth.uid()) and status = 'pending');
create policy "reviews: delete own" on public.reviews for delete
  using (author_id = (select auth.uid()) or public.is_admin());
create policy "reviews: admin moderate" on public.reviews for update using (public.is_admin());

-- inquiries: dealer sees own leads; customer sees own inquiries; inserts via API (service role) or authenticated customer
create policy "inquiries: dealer read"    on public.inquiries for select using (dealer_id = (select auth.uid()) or customer_id = (select auth.uid()) or public.is_admin());
create policy "inquiries: customer insert" on public.inquiries for insert with check (customer_id = (select auth.uid()));
create policy "inquiries: dealer update"  on public.inquiries for update using (dealer_id = (select auth.uid()) or public.is_admin());

-- visits: participants only
create policy "visits: participants read"   on public.visit_appointments for select using (dealer_id = (select auth.uid()) or customer_id = (select auth.uid()) or public.is_admin());
create policy "visits: customer insert"     on public.visit_appointments for insert with check (customer_id = (select auth.uid()));
create policy "visits: participants update" on public.visit_appointments for update using (dealer_id = (select auth.uid()) or customer_id = (select auth.uid()));

-- chat: participants only
create policy "conversations: participants" on public.conversations for select using (dealer_id = (select auth.uid()) or customer_id = (select auth.uid()) or public.is_admin());
create policy "conversations: customer start" on public.conversations for insert with check (customer_id = (select auth.uid()));
create policy "messages: participants read" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.dealer_id = (select auth.uid()) or c.customer_id = (select auth.uid()))));
create policy "messages: participants send" on public.messages for insert
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and (c.dealer_id = (select auth.uid()) or c.customer_id = (select auth.uid()))));
create policy "messages: mark read" on public.messages for update
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.dealer_id = (select auth.uid()) or c.customer_id = (select auth.uid()))));

-- notifications: own only (created by service role)
create policy "notifications: own read"   on public.notifications for select using (user_id = (select auth.uid()));
create policy "notifications: own update" on public.notifications for update using (user_id = (select auth.uid()));
create policy "notifications: own delete" on public.notifications for delete using (user_id = (select auth.uid()));

-- blog: world reads published; admin writes; comments moderated
create policy "blog_categories: public read" on public.blog_categories for select using (true);
create policy "blog_categories: admin write" on public.blog_categories for all    using (public.is_admin());
create policy "blogs: read published"        on public.blogs           for select using (status = 'published' or public.is_admin());
create policy "blogs: admin write"           on public.blogs           for all    using (public.is_admin());
create policy "blog_comments: read approved" on public.blog_comments   for select using (status = 'approved' or author_id = (select auth.uid()) or public.is_admin());
create policy "blog_comments: insert own"    on public.blog_comments   for insert with check (author_id = (select auth.uid()));
create policy "blog_comments: admin moderate" on public.blog_comments  for update using (public.is_admin());

-- reports: reporter inserts, admin manages
create policy "reports: insert" on public.property_reports for insert with check (reporter_id = (select auth.uid()) or reporter_id is null);
create policy "reports: admin"  on public.property_reports for select using (reporter_id = (select auth.uid()) or public.is_admin());
create policy "reports: admin update" on public.property_reports for update using (public.is_admin());

-- contact / newsletter: public insert, admin read
create policy "contact: public insert" on public.contact_messages for insert with check (true);
create policy "contact: admin read"    on public.contact_messages for select using (public.is_admin());
create policy "contact: admin update"  on public.contact_messages for update using (public.is_admin());
create policy "newsletter: public insert" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter: admin read"    on public.newsletter_subscribers for select using (public.is_admin());

-- site content: public read active, admin write
create policy "banners: public read"      on public.banners      for select using ((is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())) or public.is_admin());
create policy "banners: admin write"      on public.banners      for all    using (public.is_admin());
create policy "testimonials: public read" on public.testimonials for select using (is_active or public.is_admin());
create policy "testimonials: admin write" on public.testimonials for all    using (public.is_admin());
create policy "faqs: public read"         on public.faqs         for select using (is_active or public.is_admin());
create policy "faqs: admin write"         on public.faqs         for all    using (public.is_admin());
create policy "settings: admin only"      on public.site_settings for all   using (public.is_admin());

-- logs: admin read; writes happen via service role only
create policy "activity_logs: admin read" on public.activity_logs for select using (public.is_admin());
create policy "audit_logs: admin read"    on public.audit_logs    for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 14. STORAGE BUCKETS + POLICIES
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('property-images',    'property-images',    true),
  ('property-videos',    'property-videos',    true),
  ('property-documents', 'property-documents', false),
  ('kyc-documents',      'kyc-documents',      false),
  ('avatars',            'avatars',            true),
  ('dealer-assets',      'dealer-assets',      true),
  ('blog-images',        'blog-images',        true),
  ('invoices',           'invoices',           false)
on conflict (id) do nothing;

-- Public buckets: anyone reads; authenticated users write only inside their own {uid}/ folder
create policy "storage: public read public buckets" on storage.objects for select
  using (bucket_id in ('property-images', 'property-videos', 'avatars', 'dealer-assets', 'blog-images'));

create policy "storage: own folder insert" on storage.objects for insert
  with check (
    bucket_id in ('property-images', 'property-videos', 'property-documents', 'avatars', 'dealer-assets', 'kyc-documents')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage: own folder update" on storage.objects for update
  using (
    bucket_id in ('property-images', 'property-videos', 'property-documents', 'avatars', 'dealer-assets', 'kyc-documents')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage: own folder delete" on storage.objects for delete
  using (
    bucket_id in ('property-images', 'property-videos', 'property-documents', 'avatars', 'dealer-assets', 'kyc-documents')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

-- Private buckets: owner (own folder) or admin reads; invoices written by service role only
create policy "storage: private read own or admin" on storage.objects for select
  using (
    bucket_id in ('property-documents', 'kyc-documents', 'invoices')
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy "storage: admin write blog images" on storage.objects for insert
  with check (bucket_id = 'blog-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 15. SEED MASTER DATA (admin-manageable reference data, not demo content)
-- ---------------------------------------------------------------------------
insert into public.cities (name, slug, district, state, latitude, longitude, seo_title, seo_description) values
  ('Mathura',    'mathura',    'Mathura', 'Uttar Pradesh', 27.4924, 77.6737, 'Property in Mathura — Buy, Sell & Rent', 'Explore verified residential and commercial properties in Mathura. Flats, plots, houses and shops from trusted local dealers.'),
  ('Vrindavan',  'vrindavan',  'Mathura', 'Uttar Pradesh', 27.5820, 77.7000, 'Property in Vrindavan — Buy, Sell & Rent', 'Find flats, plots and homes in Vrindavan near Banke Bihari, Prem Mandir and Chaitanya Vihar from verified dealers.'),
  ('Govardhan',  'govardhan',  'Mathura', 'Uttar Pradesh', 27.4990, 77.4640, 'Property in Govardhan — Buy, Sell & Rent', 'Residential plots, homes and commercial property in Govardhan and around Parikrama Marg.'),
  ('Chhata',     'chhata',     'Mathura', 'Uttar Pradesh', 27.7280, 77.5070, null, null),
  ('Kosi Kalan', 'kosi-kalan', 'Mathura', 'Uttar Pradesh', 27.7940, 77.4360, null, null),
  ('Baldeo',     'baldeo',     'Mathura', 'Uttar Pradesh', 27.4080, 77.8220, null, null);

insert into public.areas (city_id, name, slug, pincode) values
  ((select id from public.cities where slug = 'mathura'), 'Krishna Nagar',     'krishna-nagar',     '281003'),
  ((select id from public.cities where slug = 'mathura'), 'Civil Lines',       'civil-lines',       '281001'),
  ((select id from public.cities where slug = 'mathura'), 'Dampier Nagar',     'dampier-nagar',     '281001'),
  ((select id from public.cities where slug = 'mathura'), 'Radha Nagar',       'radha-nagar',       '281003'),
  ((select id from public.cities where slug = 'mathura'), 'Holi Gate',         'holi-gate',         '281001'),
  ((select id from public.cities where slug = 'mathura'), 'Masani Road',       'masani-road',       '281003'),
  ((select id from public.cities where slug = 'mathura'), 'Bhuteshwar',        'bhuteshwar',        '281001'),
  ((select id from public.cities where slug = 'mathura'), 'Laxmi Nagar',       'laxmi-nagar',       '281004'),
  ((select id from public.cities where slug = 'mathura'), 'Refinery Nagar',    'refinery-nagar',    '281006'),
  ((select id from public.cities where slug = 'mathura'), 'Radhapuram Estate', 'radhapuram-estate', '281003'),
  ((select id from public.cities where slug = 'mathura'), 'NH-19 Highway',     'nh-19-highway',     '281001'),
  ((select id from public.cities where slug = 'mathura'), 'Goverdhan Road',    'goverdhan-road',    '281004'),
  ((select id from public.cities where slug = 'vrindavan'), 'Chaitanya Vihar', 'chaitanya-vihar',   '281121'),
  ((select id from public.cities where slug = 'vrindavan'), 'Raman Reti',      'raman-reti',        '281121'),
  ((select id from public.cities where slug = 'vrindavan'), 'Chhatikara Road', 'chhatikara-road',   '281121'),
  ((select id from public.cities where slug = 'vrindavan'), 'Parikrama Marg',  'parikrama-marg',    '281121'),
  ((select id from public.cities where slug = 'govardhan'), 'Parikrama Marg',  'parikrama-marg',    '281502'),
  ((select id from public.cities where slug = 'govardhan'), 'Radha Kund',      'radha-kund',        '281504');

insert into public.property_types (name, slug, category, position) values
  ('Apartment / Flat',    'apartment-flat',    'residential',  1),
  ('Independent House',   'independent-house', 'residential',  2),
  ('Villa',               'villa',             'residential',  3),
  ('Builder Floor',       'builder-floor',     'residential',  4),
  ('Residential Plot',    'residential-plot',  'land',         5),
  ('PG / Co-living',      'pg-co-living',      'residential',  6),
  ('Shop / Showroom',     'shop-showroom',     'commercial',   7),
  ('Office Space',        'office-space',      'commercial',   8),
  ('Commercial Plot',     'commercial-plot',   'commercial',   9),
  ('Warehouse / Godown',  'warehouse-godown',  'commercial',  10),
  ('Agricultural Land',   'agricultural-land', 'agricultural',11),
  ('Farm House',          'farm-house',        'residential', 12),
  ('Industrial Land',     'industrial-land',   'industrial',  13);

insert into public.amenities (name, slug, icon) values
  ('Car Parking',           'car-parking',        'car'),
  ('Lift',                  'lift',               'move-vertical'),
  ('Power Backup',          'power-backup',       'zap'),
  ('24x7 Water Supply',     'water-supply',       'droplets'),
  ('24x7 Security',         'security',           'shield'),
  ('CCTV Surveillance',     'cctv',               'cctv'),
  ('Park / Garden',         'park-garden',        'trees'),
  ('Gym',                   'gym',                'dumbbell'),
  ('Swimming Pool',         'swimming-pool',      'waves'),
  ('Club House',            'club-house',         'home'),
  ('Gated Community',       'gated-community',    'fence'),
  ('Vaastu Compliant',      'vaastu-compliant',   'compass'),
  ('Borewell',              'borewell',           'droplet'),
  ('Piped Gas',             'piped-gas',          'flame'),
  ('Rain Water Harvesting', 'rainwater-harvesting','cloud-rain'),
  ('Intercom',              'intercom',           'phone'),
  ('Fire Safety',           'fire-safety',        'fire-extinguisher'),
  ('Temple in Complex',     'temple-in-complex',  'landmark'),
  ('Wide Road Access',      'wide-road-access',   'route'),
  ('Corner Property',       'corner-property',    'square');

-- Default plans (prices editable from the admin panel before launch)
insert into public.subscription_plans (name, slug, description, price, duration_days, listing_limit, featured_limit, features, position) values
  ('Free',     'free',     'Get started with basic listings',                 0,    365,  3, 0, '["3 active listings", "Standard support"]', 1),
  ('Silver',   'silver',   'For growing dealers',                             999,  30,  15, 1, '["15 active listings", "1 featured slot", "Lead management", "Verified badge eligibility"]', 2),
  ('Gold',     'gold',     'For established agencies',                        2499, 30,  50, 5, '["50 active listings", "5 featured slots", "Priority support", "Analytics"]', 3),
  ('Platinum', 'platinum', 'Unlimited listings for top dealers and builders', 4999, 30,   0, 15, '["Unlimited listings", "15 featured slots", "Homepage placement", "Dedicated support"]', 4);
