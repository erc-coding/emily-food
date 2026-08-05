-- Add an optional photo for each food, either a link to a photo hosted
-- elsewhere or a URL pointing into the "food-photos" Supabase Storage
-- bucket (created separately via the Storage API, public bucket).
alter table foods add column if not exists photo_url text;

-- ---------------------------------------------------------------------------
-- Storage access for the "food-photos" bucket
-- Any authenticated household member can upload/replace/delete photos.
-- Reading is already open to everyone via the bucket's public flag, but we
-- also add an explicit SELECT policy so authenticated listing/reads work.
-- ---------------------------------------------------------------------------
create policy "household read food photos"
  on storage.objects for select
  using (bucket_id = 'food-photos');

create policy "household upload food photos"
  on storage.objects for insert
  with check (bucket_id = 'food-photos' and auth.role() = 'authenticated');

create policy "household update food photos"
  on storage.objects for update
  using (bucket_id = 'food-photos' and auth.role() = 'authenticated');

create policy "household delete food photos"
  on storage.objects for delete
  using (bucket_id = 'food-photos' and auth.role() = 'authenticated');
