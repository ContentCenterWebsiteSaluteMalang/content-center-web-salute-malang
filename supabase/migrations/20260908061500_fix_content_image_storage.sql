-- Ensure the screenshot upload bucket exists and authenticated admins can upload images.
insert into storage.buckets (id, name, public)
values ('content_images', 'content_images', true)
on conflict (id) do update set public = excluded.public;

create policy "Authenticated users can upload content images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'content_images');

create policy "Authenticated users can update content images"
on storage.objects for update
to authenticated
using (bucket_id = 'content_images')
with check (bucket_id = 'content_images');

create policy "Authenticated users can delete content images"
on storage.objects for delete
to authenticated
using (bucket_id = 'content_images');

create policy "Public can view content images"
on storage.objects for select
to public
using (bucket_id = 'content_images');
