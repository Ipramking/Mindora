export type MaterialStatus = "processing" | "ready" | "error";

export type Course = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  exam_date: string | null;
  created_at: string;
};

export type Material = {
  id: string;
  course_id: string;
  title: string;
  file_path: string;
  file_type: string;
  status: MaterialStatus;
  error_message: string | null;
  uploaded_at: string;
};

export type Chunk = {
  id: string;
  material_id: string;
  content: string;
  embedding: number[] | null;
  page_number: number | null;
  chunk_index: number;
  created_at: string;
};

export type ChatRole = "user" | "assistant";

export type ChatTone = "explain_like_5" | "standard" | "expert";

export type ChatSession = {
  id: string;
  course_id: string;
  user_id: string;
  title: string | null;
  tone: ChatTone;
  created_at: string;
};

export type ChatCitation = {
  chunk_id: string;
  material_id: string;
  material_title: string;
  page_number: number | null;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  cited_chunks: ChatCitation[] | null;
  created_at: string;
};

export type ChunkMatch = {
  id: string;
  material_id: string;
  content: string;
  page_number: number | null;
  similarity: number;
};

export type Quiz = {
  id: string;
  course_id: string;
  user_id: string;
  material_id: string | null;
  title: string;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_index: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  source_chunk_ids: string[] | null;
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total: number;
  answers: Record<string, number>;
  created_at: string;
};

export type Flashcard = {
  id: string;
  course_id: string;
  user_id: string;
  material_id: string | null;
  front: string;
  back: string;
  source_chunk_ids: string[] | null;
  created_at: string;
};

export type FlashcardReview = {
  flashcard_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
};

export type GlossaryTerm = {
  term: string;
  definition: string;
};

export type MaterialSummary = {
  id: string;
  material_id: string;
  course_id: string;
  user_id: string;
  summary: string;
  key_terms: GlossaryTerm[];
  created_at: string;
};
