import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Lesson, Material, Quiz } from "@/lib/supabase/types";
import { LessonView } from "@/app/dashboard/courses/[id]/materials/[materialId]/lesson/_components/lesson-view";
import { PageHero } from "@/components/page-hero";

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
      <PageHero
        seed={id}
        backHref={`/dashboard/courses/${id}`}
        backLabel="Back to course"
        title={material.title}
        subtitle="Lesson"
        actions={
          quiz && (
            <Link
              href={`/dashboard/courses/${id}/quizzes/${quiz.id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Take the quiz
            </Link>
          )
        }
      />

      <LessonView
        materialId={material.id}
        materialStatus={material.status}
        initialLesson={lesson ?? null}
      />
    </div>
  );
}
