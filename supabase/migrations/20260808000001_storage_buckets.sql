-- ============================================================================
-- Storage buckets + RLS policies
-- Run via: supabase db push  (or paste into Supabase SQL Editor)
--
-- property-images : public read, authenticated write scoped to owner folder
-- kyc-documents   : private, owner write, admin (service role) reads all
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. property-images  (public bucket — listing photos)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,                             -- public: images are served without auth
  10485760,                         -- 10 MB per file
  array['image/jpeg','image/jpg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public SELECT — anyone can read listing images
create policy "property-images: public read"
  on storage.objects for select
  using (bucket_id = 'property-images');

-- Authenticated INSERT — only into the seller's own folder
-- Path convention enforced by ImageUploader: {seller_id}/{property_id}/{filename}
create policy "property-images: authenticated upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated UPDATE — owner can update metadata on their own objects
create policy "property-images: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated DELETE — owner can delete their own objects
create policy "property-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 2. kyc-documents  (private bucket — identity and business docs)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,                            -- private: no public URL access
  10485760,                         -- 10 MB per file
  array['image/jpeg','image/jpg','image/png','application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated INSERT — only into own folder
-- Path convention: {seller_id}/{doc_type}/{filename}
create policy "kyc-documents: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated SELECT — seller can read their own documents
-- Admin reads via service-role client (bypasses RLS entirely)
create policy "kyc-documents: owner read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No public UPDATE or DELETE on KYC documents
-- Documents are immutable once uploaded; admin manages via service role
