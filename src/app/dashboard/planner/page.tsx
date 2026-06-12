import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  Flashcard,
  FlashcardReview,
  Quiz,
  QuizAttempt,
  QuizQuestion,
} from "@/lib/supabase/types";

const EXAM_WARNING_DAYS = 7;

type Task = {
  courseId: string;
  courseTitle: string;
  label: string;
  detail: string;
  href: string;
  urgency: number; // lower = more urgent
};

export default async function PlannerPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  const tasks: Task[] = [];
  const now = Date.now();

  for (const course of courses ?? []) {
    // Exam countdown
    if (course.exam_date) {
      const examTime = new Date(course.exam_date).getTime();
      const daysUntil = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= EXAM_WARNING_DAYS) {
        tasks.push({
          courseId: course.id,
          courseTitle: course.title,
          label:
            daysUntil === 0
              ? `Exam today!`
              : `Exam in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
          detail: "Prioritize review for this course.",
          href: `/dashboard/courses/${course.id}/progress`,
          urgency: 0 + daysUntil / 100,
        });
      }
    }

    // Due flashcards
    const { data: cardIdsData } = await supabase
      .from("flashcards")
      .select("id")
      .eq("course_id", course.id)
      .returns<Pick<Flashcard, "id">[]>();

    const cardIds = (cardIdsData ?? []).map((c) => c.id);

    if (cardIds.length > 0) {
      const { data: reviews } = await supabase
        .from("flashcard_reviews")
        .select("*")
        .in("flashcard_id", cardIds)
        .lte("due_at", new Date().toISOString())
        .returns<FlashcardReview[]>();

      const dueCount = reviews?.length ?? 0;
      if (dueCount > 0) {
        tasks.push({
          courseId: course.id,
          courseTitle: course.title,
          label: `Review ${dueCount} flashcard${dueCount === 1 ? "" : "s"}`,
          detail: "Due now",
          href: `/dashboard/courses/${course.id}/flashcards/review`,
          urgency: 1 - dueCount / 1000,
        });
      }
    }

    // Weak topics from latest quiz attempts
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("*")
      .eq("course_id", course.id)
      .returns<Quiz[]>();

    const quizIds = (quizzes ?? []).map((q) => q.id);
    if (quizIds.length > 0) {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("*")
        .in("quiz_id", quizIds)
        .order("created_at", { ascending: false })
        .returns<QuizAttempt[]>();

      const latestAttemptByQuiz = new Map<string, QuizAttempt>();
      for (const attempt of attempts ?? []) {
        if (!latestAttemptByQuiz.has(attempt.quiz_id)) {
          latestAttemptByQuiz.set(attempt.quiz_id, attempt);
        }
      }

      if (latestAttemptByQuiz.size > 0) {
        const { data: questions } = await supabase
          .from("quiz_questions")
          .select("*")
          .in("quiz_id", [...latestAttemptByQuiz.keys()])
          .returns<QuizQuestion[]>();

        let missedCount = 0;
        for (const question of questions ?? []) {
          const attempt = latestAttemptByQuiz.get(question.quiz_id);
          if (!attempt) continue;
          if (attempt.answers[question.id] !== question.correct_index) {
            missedCount += 1;
          }
        }

        if (missedCount > 0) {
          tasks.push({
            courseId: course.id,
            courseTitle: course.title,
            label: `Revisit ${missedCount} topic${missedCount === 1 ? "" : "s"} you missed`,
            detail: "From your most recent quiz attempts",
            href: `/dashboard/courses/${course.id}/progress`,
            urgency: 2,
          });
        }
      }
    }
  }

  tasks.sort((a, b) => a.urgency - b.urgency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Study planner</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Your suggested study tasks across all courses, based on due flashcards, recent quiz
          results, and upcoming exams.
        </p>
      </div>

      {tasks.length > 0 ? (
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {tasks.map((task, i) => (
            <li key={i}>
              <Link
                href={task.href}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{task.label}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{task.detail}</p>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  {task.courseTitle}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            You&apos;re all caught up! No flashcards are due, no quiz topics need review, and no
            exams are coming up soon.
          </p>
        </div>
      )}
    </div>
  );
}
