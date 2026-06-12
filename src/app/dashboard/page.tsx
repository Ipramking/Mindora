import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateCourseForm } from "@/app/dashboard/_components/create-course-form";
import type { Course } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const name = userData.user?.user_metadata?.name as string | undefined;

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome{name ? `, ${name}` : ""} 👋
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Create a course and upload your materials to get started.
        </p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-700"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{course.title}</h3>
              {course.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {course.description}
                </p>
              )}
            </Link>
          ))}
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
