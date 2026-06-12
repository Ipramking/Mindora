import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuizQuestion } from "@/lib/supabase/types";

export async function POST(request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const answers = body?.answers;

  if (typeof answers !== "object" || answers === null) {
    return NextResponse.json({ error: "Missing answers" }, { status: 400 });
  }

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("question_index", { ascending: true })
    .returns<QuizQuestion[]>();

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  let score = 0;
  const results = questions.map((q) => {
    const selected = answers[q.id];
    const correct = selected === q.correct_index;
    if (correct) score += 1;
    return {
      id: q.id,
      correct_index: q.correct_index,
      explanation: q.explanation,
      selected: typeof selected === "number" ? selected : null,
      correct,
    };
  });

  const { error: attemptError } = await supabase.from("quiz_attempts").insert({
    quiz_id: quizId,
    user_id: userData.user.id,
    score,
    total: questions.length,
    answers,
  });

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  return NextResponse.json({ score, total: questions.length, results });
}
