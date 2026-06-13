import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Material } from "@/lib/supabase/types";
import { GenerateFlashcardsForm } from "@/app/dashboard/courses/[id]/flashcards/_components/generate-flashcards-form";
import { PageHero } from "@/components/page-hero";

export default async function CourseFlashcardsPage({
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

  const { count: totalCount } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("course_id", id);

  const { data: cardIdsData } = await supabase
    .from("flashcards")
    .select("id")
    .eq("course_id", id)
    .returns<{ id: string }[]>();

  const cardIds = (cardIdsData ?? []).map((c) => c.id);

  let dueCount = 0;
  if (cardIds.length > 0) {
    const { count } = await supabase
      .from("flashcard_reviews")
      .select("flashcard_id", { count: "exact", head: true })
      .in("flashcard_id", cardIds)
      .lte("due_at", new Date().toISOString());
    dueCount = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <PageHero
        seed={course.id}
        backHref={`/dashboard/courses/${course.id}`}
        backLabel={`Back to ${course.title}`}
        title="Flashcards"
      />

      <GenerateFlashcardsForm courseId={course.id} materials={materials ?? []} />

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-0">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {totalCount ?? 0} card{(totalCount ?? 0) === 1 ? "" : "s"} in this deck
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {dueCount} due for review now
          </p>
        </div>
        <Link
          href={`/dashboard/courses/${course.id}/flashcards/review`}
          aria-disabled={dueCount === 0}
          className={`shrink-0 rounded-lg px-4 py-2 text-center text-sm font-medium text-white transition-colors ${
            dueCount === 0
              ? "pointer-events-none bg-zinc-300 dark:bg-zinc-700"
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
        >
          Review now
        </Link>
      </div>
    </div>
  );
}
