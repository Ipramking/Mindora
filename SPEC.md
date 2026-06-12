# Mindora — AI Study Guide & Lecture Teacher

## 1. Vision

Mindora is a friendly AI tutor that students feed their own course materials
(lecture slides, PDFs, notes, textbooks, recordings) into. It then:

- **Teaches** the material conversationally, like a patient tutor who has
  actually read the student's notes.
- **Studies** with the student via quizzes, flashcards, and summaries
  generated from their own materials.
- **Tracks progress** per course/topic so the student knows what they've
  mastered and what needs more work.

Tone: warm, encouraging, patient — never condescending. Always grounds
answers in the student's own materials and cites where info came from
("from your Week 4 slides, page 3").

---

## 2. MVP Feature Set (Phase 1)

1. **Auth** — sign up / log in (email, or Google OAuth).
2. **Courses** — create a "course" or "subject" as a container for materials.
3. **Upload materials** — PDF, DOCX, PPTX, TXT, Markdown. (Audio
   transcription is Phase 2.)
4. **Ingestion pipeline** — parse → chunk → embed → store in vector DB,
   scoped per course/document.
5. **Chat / Tutor mode** — chat interface scoped to a course (or a single
   document). RAG retrieves relevant chunks; Claude answers in a tutor
   persona, with source citations and follow-up "check your understanding"
   questions.
6. **Quiz generation** — generate multiple-choice / short-answer quizzes
   from a document or course, with instant feedback and explanations.
7. **Flashcards** — auto-generate flashcard decks from materials; basic
   spaced-repetition review (e.g. SM-2 algorithm).
8. **Summaries** — one-click chapter/lecture summaries and key-term glossaries.
9. **Progress dashboard** — per course: materials studied, quiz scores over
   time, flashcard review streaks, weak topics flagged.

## 3. Phase 2+ (Stretch)

- Audio lecture upload + transcription (Whisper or similar) → searchable
  transcript + summary.
- Image/diagram understanding (Claude vision) for scanned notes/slides.
- "Explain like I'm 5 / like an expert" tone slider.
- Study planner — suggests a daily review schedule based on upcoming exams
  and weak areas.
- Collaborative study groups / shared courses.
- Mobile app (React Native) wrapping the same backend.
- Export flashcards to Anki.

---

## 4. Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  Next.js     │◄────►│  API routes /     │◄────►│  Postgres + pgvector│
│  (frontend)  │      │  backend services │      │  (Supabase)         │
└─────────────┘      └─────────┬─────────┘      └────────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          File storage     Embedding API    Claude API
          (Supabase        (Voyage AI)      (chat, quiz gen,
           Storage)                          summaries)
```

### Why this stack
- **Next.js (App Router) + Tailwind + shadcn/ui** — single codebase for
  frontend + API routes, fast to iterate, easy deploy on Vercel.
- **Supabase** — gives us Postgres, pgvector, file storage, and auth in one
  place. Avoids standing up separate infra for an MVP.
- **Voyage AI embeddings** — Anthropic's recommended embedding provider,
  pairs well with Claude for RAG.
- **Claude API (Sonnet)** — tutoring chat, quiz/flashcard generation,
  summarization. Use prompt caching for course-context-heavy prompts to
  keep costs down.

---

## 5. Data Model (simplified)

```
users
  id, email, name, created_at

courses
  id, user_id, title, description, created_at

materials
  id, course_id, title, file_url, file_type, status (processing/ready/error),
  uploaded_at

chunks
  id, material_id, content, embedding (vector), page_number, chunk_index

chat_sessions
  id, course_id, user_id, created_at

chat_messages
  id, session_id, role (user/assistant), content, cited_chunk_ids[],
  created_at

quizzes
  id, course_id/material_id, title, created_at

quiz_questions
  id, quiz_id, question, options[], correct_answer, explanation,
  source_chunk_ids[]

quiz_attempts
  id, quiz_id, user_id, score, answers (jsonb), taken_at

flashcards
  id, course_id/material_id, front, back, source_chunk_ids[]

flashcard_reviews
  id, flashcard_id, user_id, ease_factor, interval_days, due_at,
  last_reviewed_at
```

---

## 6. AI Pipeline Details

### Ingestion
1. User uploads file → stored in Supabase Storage.
2. Background job parses file:
   - PDF → `pdf-parse` / `pdfjs`
   - DOCX → `mammoth`
   - PPTX → `pptx-parser` or convert to text via library
3. Text is chunked (~500-800 tokens, with overlap) preserving page/slide
   numbers for citations.
4. Each chunk embedded via Voyage AI → stored in `chunks` table with
   pgvector index.
5. Material status flips to `ready`; UI notifies user.

### Tutor Chat (RAG)
1. User asks a question in a course chat.
2. Query embedded → top-K similar chunks retrieved via pgvector
   cosine-similarity search (scoped to course or specific material).
3. Claude prompt assembled:
   - System prompt: "friendly tutor" persona + instructions to cite sources
     and check understanding.
   - Context: retrieved chunks (with material/page references).
   - Conversation history (recent messages).
4. Claude responds; citations mapped back to chunk IDs and shown as
   clickable references in the UI (jump to source page).

### Quiz / Flashcard Generation
- Select a material or course → retrieve all (or sampled) chunks → prompt
  Claude to generate N questions/flashcards in structured JSON
  (use tool-use / structured output for reliability).
- Store generated items linked back to source chunks for "why is this the
  answer" explanations.

### Summaries
- Map-reduce style: summarize each chunk/section, then summarize the
  summaries into a cohesive overview + glossary of key terms.

---

## 7. UI/UX Flow (MVP)

1. **Dashboard** — list of courses, quick stats (materials, last studied,
   upcoming flashcard reviews due).
2. **Course page** — tabs: *Materials*, *Chat/Tutor*, *Quizzes*,
   *Flashcards*, *Progress*.
3. **Materials tab** — upload area, list of materials with processing
   status, click to view extracted text/preview.
4. **Tutor chat** — chat UI, can scope question to "whole course" or a
   specific material; citations rendered as small reference chips.
5. **Quizzes tab** — generate new quiz (choose material/scope/difficulty/#
   questions), take quiz, see results + explanations.
6. **Flashcards tab** — generate deck, review session (Leitner/SM-2 style),
   "due today" counter.
7. **Progress tab** — charts: quiz scores over time, flashcards mastered,
   topics needing review (based on quiz misses).

---

## 8. Roadmap

| Phase | Scope |
|-------|-------|
| 0 | Project scaffold: Next.js + Supabase + Claude API wired up, auth working |
| 1 | Upload + ingestion pipeline (PDF/DOCX/TXT → chunks + embeddings) |
| 2 | Tutor chat with RAG + citations |
| 3 | Quiz generation + taking quizzes |
| 4 | Flashcards + spaced repetition |
| 5 | Progress dashboard |
| 6 | Polish: tone/persona tuning, summaries, glossary |
| 7+ | Stretch features (audio, vision, planner, mobile) |

---

## 9. Open Questions

- Hosting/budget: Vercel + Supabase free tiers should cover early
  development; Claude + Voyage API usage is pay-as-you-go.
- File size limits for uploads (large textbooks may need special handling).
- Do we want multi-user/shared courses in MVP, or strictly single-user?
