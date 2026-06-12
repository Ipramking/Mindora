import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  Flashcard,
  FlashcardReview,
  Material,
  Quiz,
  QuizAttempt,
  QuizQuestion,
} from "@/lib/supabase/types";

const MASTERED_INTERVAL_DAYS = 21;

export default async function CourseProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single<Course>();

  if (!course) {
    notFound();
  }

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .eq("course_id", id)
    .returns<Material[]>();

  const materialStats = {
    total: materials?.length ?? 0,
    ready: materials?.filter((m) => m.status === "ready").length ?? 0,
    processing: materials?.filter((m) => m.status === "processing").length ?? 0,
    error: materials?.filter((m) => m.status === "error").length ?? 0,
  };

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false })
    .returns<Quiz[]>();

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const quizTitleById = new Map((quizzes ?? []).map((q) => [q.id, q.title]));

  let attempts: QuizAttempt[] = [];
  if (quizIds.length > 0) {
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*")
      .in("quiz_id", quizIds)
      .order("created_at", { ascending: false })
      .returns<QuizAttempt[]>();
    attempts = data ?? [];
  }

  const recentAttempts = attempts.slice(0, 10);
  const averageScorePct =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((sum, a) => sum + a.score / a.total, 0) / attempts.length) * 100
        )
      : null;

  // Most recent attempt per quiz, used to surface "needs review" questions.
  const latestAttemptByQuiz = new Map<string, QuizAttempt>();
  for (const attempt of attempts) {
    if (!latestAttemptByQuiz.has(attempt.quiz_id)) {
      latestAttemptByQuiz.set(attempt.quiz_id, attempt);
    }
  }

  const weakSpots: { quizId: string; quizTitle: string; question: string; explanation: string | null }[] =
    [];

  if (latestAttemptByQuiz.size > 0) {
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("quiz_id", [...latestAttemptByQuiz.keys()])
      .returns<QuizQuestion[]>();

    for (const question of questions ?? []) {
      const attempt = latestAttemptByQuiz.get(question.quiz_id);
      if (!attempt) continue;
      const selected = attempt.answers[question.id];
      if (selected !== question.correct_index) {
        weakSpots.push({
          quizId: question.quiz_id,
          quizTitle: quizTitleById.get(question.quiz_id) ?? "Quiz",
          question: question.question,
          explanation: question.explanation,
        });
      }
    }
  }

  const { data: cardIdsData } = await supabase
    .from("flashcards")
    .select("id")
    .eq("course_id", id)
    .returns<Pick<Flashcard, "id">[]>();

  const cardIds = (cardIdsData ?? []).map((c) => c.id);

  let flashcardStats = { total: 0, due: 0, mastered: 0, learning: 0 };
  if (cardIds.length > 0) {
    const { data: reviews } = await supabase
      .from("flashcard_reviews")
      .select("*")
      .in("flashcard_id", cardIds)
      .returns<FlashcardReview[]>();

    const now = Date.now();
    const due = reviews?.filter((r) => new Date(r.due_at).getTime() <= now).length ?? 0;
    const mastered = reviews?.filter((r) => r.interval_days >= MASTERED_INTERVAL_DAYS).length ?? 0;

    flashcardStats = {
      total: cardIds.length,
      due,
      mastered,
      learning: cardIds.length - mastered,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to {course.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Progress</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Materials"
          value={`${materialStats.ready} / ${materialStats.total}`}
          sublabel="ready to study"
        />
        <StatCard
          label="Quiz average"
          value={averageScorePct != null ? `${averageScorePct}%` : "—"}
          sublabel={`${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Flashcards mastered"
          value={`${flashcardStats.mastered} / ${flashcardStats.total}`}
          sublabel={`${flashcardStats.due} due now`}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Recent quiz scores</h2>
        {recentAttempts.length > 0 ? (
          <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {recentAttempts.map((attempt) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              return (
                <li key={attempt.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {quizTitleById.get(attempt.quiz_id) ?? "Quiz"}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(attempt.created_at).toLocaleDateString()} ·{" "}
                      {attempt.score} / {attempt.total}
                    </p>
                  </div>
                  <div className="h-2 w-32 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              No quiz attempts yet.{" "}
              <Link
                href={`/dashboard/courses/${course.id}/quizzes`}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Take a quiz
              </Link>{" "}
              to see your progress here.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Needs review</h2>
        {weakSpots.length > 0 ? (
          <ul className="space-y-3">
            {weakSpots.slice(0, 6).map((spot, i) => (
              <li
                key={i}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
              >
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {spot.quizTitle}
                </p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-50">{spot.question}</p>
                {spot.explanation && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{spot.explanation}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nothing flagged yet — keep taking quizzes and we&apos;ll surface topics to review here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{sublabel}</p>
    </div>
  );
}
