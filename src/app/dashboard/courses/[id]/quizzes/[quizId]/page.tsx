import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Quiz, QuizQuestion } from "@/lib/supabase/types";
import { QuizRunner } from "@/app/dashboard/courses/[id]/quizzes/[quizId]/_components/quiz-runner";
import { PageHero } from "@/components/page-hero";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single<Course>();

  if (!course) {
    notFound();
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single<Quiz>();

  if (!quiz) {
    notFound();
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("question_index", { ascending: true })
    .returns<QuizQuestion[]>();

  return (
    <div className="space-y-6">
      <PageHero
        seed={course.id}
        backHref={`/dashboard/courses/${course.id}/quizzes`}
        backLabel="Back to quizzes"
        title={quiz.title}
      />

      <QuizRunner quizId={quiz.id} questions={questions ?? []} />
    </div>
  );
}
