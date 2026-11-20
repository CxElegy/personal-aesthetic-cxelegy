-- 审美图鉴的数据库结构（Supabase / Postgres）
-- 条目表：网站每次打开都从这里读；data 里放和 catalog/items.json 一样的字段，video_path 是存储桶里的视频路径
create table if not exists public.aesthetic_items (
  id          text primary key,
  data        jsonb not null,
  video_path  text,
  video_bytes bigint,
  updated_at  timestamptz not null default now()
);
alter table public.aesthetic_items enable row level security;
-- 所有人可以读（网站是公开的）；写入只能用 service_role 密钥（上传脚本），网页上不能改
drop policy if exists "public read" on public.aesthetic_items;
create policy "public read" on public.aesthetic_items for select using (true);

-- 视频存储桶：公开读取，写入只能用 service_role 密钥
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aesthetic-videos', 'aesthetic-videos', true, 104857600, array['video/mp4','video/webm'])
on conflict (id) do update set public = excluded.public;
