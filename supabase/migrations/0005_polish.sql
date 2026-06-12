-- Phase 6: tone/persona tuning + material summaries/glossaries

alter table chat_sessions
  add column if not exists tone text not null default 'standard'
    check (tone in ('explain_like_5', 'standard', 'expert'));

create table if not exists material_summaries (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null unique references materials(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  key_terms jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table material_summaries enable row level security;

create policy "material_summaries_owner" on material_summaries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
