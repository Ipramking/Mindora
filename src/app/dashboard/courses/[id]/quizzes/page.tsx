import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Material, Quiz } from "@/lib/supabase/types";
import { GenerateQuizForm } from "@/app/dashboard/courses/[id]/quizzes/_components/generate-quiz-form";
import { PageHero } from "@/components/page-hero";

export default async function CourseQuizzesPage({
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
    .eq("status", "ready")
    .order("uploaded_at", { ascending: false })
    .returns<Material[]>();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false })
    .returns<Quiz[]>();

  return (
    <div className="space-y-6">
      <PageHero
        seed={course.id}
        backHref={`/dashboard/courses/${course.id}`}
        backLabel={`Back to ${course.title}`}
        title="Quizzes"
      />

      <GenerateQuizForm courseId={course.id} materials={materials ?? []} />

      {quizzes && quizzes.length > 0 ? (
        <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Link
                href={`/dashboard/courses/${course.id}/quizzes/${quiz.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-zinc-50 sm:px-5 dark:hover:bg-zinc-800/60"
              >
                <p className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50">{quiz.title}</p>
                <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(quiz.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No quizzes yet. Generate one above from your course materials.
          </p>
        </div>
      )}
    </div>
  );
}
