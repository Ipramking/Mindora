-- Mindora Phase 1: courses, materials, chunks + storage + RLS

create extension if not exists vector;

-- Courses ---------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Users manage their own courses"
  on public.courses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Materials ---------------------------------------------------------------

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  file_path text not null,
  file_type text not null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  uploaded_at timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "Users manage materials in their own courses"
  on public.materials
  for all
  using (
    exists (
      select 1 from public.courses
      where courses.id = materials.course_id
        and courses.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses
      where courses.id = materials.course_id
        and courses.user_id = auth.uid()
    )
  );

-- Chunks ---------------------------------------------------------------

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials (id) on delete cascade,
  content text not null,
  embedding vector(1024),
  page_number int,
  chunk_index int not null,
  created_at timestamptz not null default now()
);

alter table public.chunks enable row level security;

create policy "Users manage chunks in their own materials"
  on public.chunks
  for all
  using (
    exists (
      select 1 from public.materials
      join public.courses on courses.id = materials.course_id
      where materials.id = chunks.material_id
        and courses.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.materials
      join public.courses on courses.id = materials.course_id
      where materials.id = chunks.material_id
        and courses.user_id = auth.uid()
    )
  );

create index if not exists chunks_embedding_idx
  on public.chunks using hnsw (embedding vector_cosine_ops);

create index if not exists chunks_material_id_idx
  on public.chunks (material_id);

-- Storage ---------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "Users manage files in their own folder"
  on storage.objects
  for all
  using (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
