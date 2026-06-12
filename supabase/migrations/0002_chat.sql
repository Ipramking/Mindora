-- Phase 2: tutor chat with RAG

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  cited_chunks jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_idx on chat_messages(session_id);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create policy "chat_sessions_owner" on chat_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_messages_owner" on chat_messages
  for all
  using (
    exists (
      select 1 from chat_sessions cs
      where cs.id = chat_messages.session_id
        and cs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_sessions cs
      where cs.id = chat_messages.session_id
        and cs.user_id = auth.uid()
    )
  );

-- Vector similarity search over chunks, scoped to a course.
-- security invoker (default) so RLS on chunks/materials/courses still applies.
create or replace function match_chunks(
  query_embedding vector(1024),
  match_course_id uuid,
  match_count int default 6
)
returns table (
  id uuid,
  material_id uuid,
  content text,
  page_number int,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.material_id,
    c.content,
    c.page_number,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  join materials m on m.id = c.material_id
  where m.course_id = match_course_id
    and m.status = 'ready'
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
