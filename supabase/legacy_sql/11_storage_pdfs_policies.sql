-- Allow anyone to read files (for download)
create policy "Public read access"
on storage.objects
for select
to public
using (bucket_id = 'pdfs');

-- Allow authenticated users to upload
create policy "Authenticated users can upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pdfs');
