import { createClient } from "@/lib/supabase/server";
import { CreateCourseForm } from "@/app/dashboard/_components/create-course-form";
import { GlowCard } from "@/components/glow-card";
import type { Course, Material } from "@/lib/supabase/types";

function examBadge(examDate: string | null): { label: string; urgent: boolean } | null {
  if (!examDate) return null;
  const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return null;
  if (daysUntil === 0) return { label: "Exam today", urgent: true };
  if (daysUntil === 1) return { label: "Exam tomorrow", urgent: true };
  return { label: `Exam in ${daysUntil} days`, urgent: daysUntil <= 7 };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const name = userData.user?.user_metadata?.name as string | undefined;

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  const courseIds = (courses ?? []).map((c) => c.id);
  const { data: materials } =
    courseIds.length > 0
      ? await supabase
          .from("materials")
          .select("course_id")
          .in("course_id", courseIds)
          .returns<Pick<Material, "course_id">[]>()
      : { data: [] as Pick<Material, "course_id">[] };

  const materialCounts = new Map<string, number>();
  for (const material of materials ?? []) {
    materialCounts.set(material.course_id, (materialCounts.get(material.course_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div className="hero-glow rounded-3xl border border-zinc-200 p-8 dark:border-zinc-800">
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome{name ? `, ${name}` : ""} 👋
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Create a course and upload your materials — Mindora will turn them into lessons,
            quizzes, and flashcards automatically.
          </p>
        </div>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const count = materialCounts.get(course.id) ?? 0;
            const exam = examBadge(course.exam_date);
            return (
              <GlowCard key={course.id} seed={course.id} href={`/dashboard/courses/${course.id}`}>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{course.title}</h3>
                {course.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {course.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {count} material{count === 1 ? "" : "s"}
                  </span>
                  {exam && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        exam.urgent
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                      }`}
                    >
                      {exam.label}
                    </span>
                  )}
                </div>
              </GlowCard>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            You don&apos;t have any courses yet.
          </p>
        </div>
      )}

      <CreateCourseForm />
    </div>
  );
}
