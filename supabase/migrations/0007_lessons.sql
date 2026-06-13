-- Phase 7: auto-generated lessons per material

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null unique references materials(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table lessons enable row level security;

create policy "lessons_owner" on lessons
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
