import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson, Material, Quiz } from "@/lib/supabase/types";
import { UploadMaterialForm } from "@/app/dashboard/courses/[id]/_components/upload-material-form";
import { MaterialsList } from "@/app/dashboard/courses/[id]/_components/materials-list";
import { ExamDateForm } from "@/app/dashboard/courses/[id]/_components/exam-date-form";
import { gradientFor } from "@/components/glow-card";

export default async function CoursePage({
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
    .order("uploaded_at", { ascending: false })
    .returns<Material[]>();

  const materialIds = (materials ?? []).map((m) => m.id);

  const [{ data: lessons }, { data: quizzes }] = await Promise.all([
    materialIds.length > 0
      ? supabase
          .from("lessons")
          .select("material_id, status")
          .in("material_id", materialIds)
          .returns<Pick<Lesson, "material_id" | "status">[]>()
      : Promise.resolve({ data: [] as Pick<Lesson, "material_id" | "status">[] }),
    materialIds.length > 0
      ? supabase
          .from("quizzes")
          .select("id, material_id, created_at")
          .in("material_id", materialIds)
          .order("created_at", { ascending: false })
          .returns<Pick<Quiz, "id" | "material_id" | "created_at">[]>()
      : Promise.resolve({ data: [] as Pick<Quiz, "id" | "material_id" | "created_at">[] }),
  ]);

  const lessonByMaterial = new Map((lessons ?? []).map((l) => [l.material_id, l]));
  const quizByMaterial = new Map<string, string>();
  for (const quiz of quizzes ?? []) {
    if (quiz.material_id && !quizByMaterial.has(quiz.material_id)) {
      quizByMaterial.set(quiz.material_id, quiz.id);
    }
  }

  const materialsWithExtras = (materials ?? []).map((material) => ({
    ...material,
    lesson: lessonByMaterial.get(material.id)
      ? { status: lessonByMaterial.get(material.id)!.status }
      : null,
    quizId: quizByMaterial.get(material.id) ?? null,
  }));

  const gradient = gradientFor(course.id);

  return (
    <div className="space-y-6">
      <div className="hero-glow overflow-hidden rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className={`inline-block rounded-full bg-gradient-to-r ${gradient} px-3 py-1 text-xs font-medium text-white shadow-sm`}
            >
              Course
            </span>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {course.title}
            </h1>
            {course.description && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{course.description}</p>
            )}
            <div className="mt-2">
              <ExamDateForm courseId={course.id} examDate={course.exam_date} />
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/dashboard/courses/${course.id}/progress`}
              className="rounded-lg border border-zinc-300 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-700 backdrop-blur transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Progress
            </Link>
            <Link
              href={`/dashboard/courses/${course.id}/flashcards`}
              className="rounded-lg border border-zinc-300 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-700 backdrop-blur transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Flashcards
            </Link>
            <Link
              href={`/dashboard/courses/${course.id}/quizzes`}
              className="rounded-lg border border-zinc-300 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-700 backdrop-blur transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Quizzes
            </Link>
            <Link
              href={`/dashboard/courses/${course.id}/chat`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Open Tutor Chat
            </Link>
          </div>
        </div>
      </div>

      <UploadMaterialForm courseId={course.id} />

      <MaterialsList materials={materialsWithExtras} />
    </div>
  );
}
