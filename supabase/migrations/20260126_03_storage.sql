
-- 5. STORAGE
-- Secure buckets for user assets

insert into storage.buckets (id, name, public)
values ('projects', 'projects', true);

-- Enable RLS
create policy "Project images are public."
  on storage.objects for select
  using ( bucket_id = 'projects' );

create policy "Users can upload project images."
  on storage.objects for insert
  with check (
    bucket_id = 'projects' and
    auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own project images."
  on storage.objects for update
  using (
    bucket_id = 'projects' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own project images."
  on storage.objects for delete
  using (
    bucket_id = 'projects' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
