import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Lesson, Material, Quiz } from "@/lib/supabase/types";
import { LessonView } from "@/app/dashboard/courses/[id]/materials/[materialId]/lesson/_components/lesson-view";

export default async function MaterialLessonPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const { id, materialId } = await params;
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("course_id", id)
    .single<Material>();

  if (!material) {
    notFound();
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("material_id", materialId)
    .maybeSingle<Lesson>();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("material_id", materialId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Quiz>();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/courses/${id}`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to course
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {material.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Lesson</p>
        </div>
        {quiz && (
          <Link
            href={`/dashboard/courses/${id}/quizzes/${quiz.id}`}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Take the quiz
          </Link>
        )}
      </div>

      <LessonView
        materialId={material.id}
        materialStatus={material.status}
        initialLesson={lesson ?? null}
      />
    </div>
  );
}
