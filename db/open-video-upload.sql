-- 在店长 PC 的自建 Supabase（https://elegy.tailc8cfff.ts.net）上执行一次。
-- 作用：建一个公开读取的视频存储桶 aesthetic-videos，并临时允许用 publishable key 上传到这个桶。
-- 上传权限在 2026-11-21 05:19:10+00（UTC）自动失效：policy 里的时间条件过期后就不再允许上传，不需要手动关闭。
-- 只影响 aesthetic-videos 这个桶，不碰 Wishlist 的表和其他桶。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aesthetic-videos', 'aesthetic-videos', true, 104857600, array['video/mp4','video/webm','application/json'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "aesthetic videos public read" on storage.objects;
create policy "aesthetic videos public read" on storage.objects
  for select using (bucket_id = 'aesthetic-videos');

drop policy if exists "aesthetic videos temp upload" on storage.objects;
create policy "aesthetic videos temp upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'aesthetic-videos' and now() < timestamptz '2026-11-21 05:19:10+00');
