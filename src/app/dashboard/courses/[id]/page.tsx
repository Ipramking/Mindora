import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Material } from "@/lib/supabase/types";
import { UploadMaterialForm } from "@/app/dashboard/courses/[id]/_components/upload-material-form";
import { MaterialsList } from "@/app/dashboard/courses/[id]/_components/materials-list";
import { ExamDateForm } from "@/app/dashboard/courses/[id]/_components/exam-date-form";

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">{course.description}</p>
          )}
          <div className="mt-2">
            <ExamDateForm courseId={course.id} examDate={course.exam_date} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/dashboard/courses/${course.id}/progress`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Progress
          </Link>
          <Link
            href={`/dashboard/courses/${course.id}/flashcards`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Flashcards
          </Link>
          <Link
            href={`/dashboard/courses/${course.id}/quizzes`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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

      <UploadMaterialForm courseId={course.id} />

      <MaterialsList materials={materials ?? []} />
    </div>
  );
}
