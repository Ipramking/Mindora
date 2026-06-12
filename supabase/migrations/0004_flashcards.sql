-- Phase 4: flashcards + spaced repetition

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  front text not null,
  back text not null,
  source_chunk_ids uuid[],
  created_at timestamptz not null default now()
);

create table if not exists flashcard_reviews (
  flashcard_id uuid primary key references flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days real not null default 0,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz
);

create index if not exists flashcards_course_id_idx on flashcards(course_id);
create index if not exists flashcard_reviews_due_at_idx on flashcard_reviews(due_at);

alter table flashcards enable row level security;
alter table flashcard_reviews enable row level security;

create policy "flashcards_owner" on flashcards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "flashcard_reviews_owner" on flashcard_reviews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
