-- Phase 3: quiz generation + taking quizzes

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references materials(id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_index int not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  source_chunk_ids uuid[]
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score int not null,
  total int not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_id_idx on quiz_questions(quiz_id);
create index if not exists quiz_attempts_quiz_id_idx on quiz_attempts(quiz_id);

alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;

create policy "quizzes_owner" on quizzes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quiz_questions_owner" on quiz_questions
  for all
  using (
    exists (
      select 1 from quizzes q
      where q.id = quiz_questions.quiz_id
        and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from quizzes q
      where q.id = quiz_questions.quiz_id
        and q.user_id = auth.uid()
    )
  );

create policy "quiz_attempts_owner" on quiz_attempts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
