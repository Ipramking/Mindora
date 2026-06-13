import Link from "next/link";
import type { Lesson, Material } from "@/lib/supabase/types";

const STATUS_STYLES: Record<Material["status"], string> = {
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABELS: Record<Material["status"], string> = {
  processing: "Processing",
  ready: "Ready",
  error: "Error",
};

const LESSON_STATUS_STYLES: Record<Lesson["status"], string> = {
  processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  error: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const LESSON_STATUS_LABELS: Record<Lesson["status"], string> = {
  processing: "Lesson generating...",
  ready: "Lesson ready",
  error: "Lesson failed",
};

export type MaterialWithExtras = Material & {
  lesson: Pick<Lesson, "status"> | null;
  quizId: string | null;
};

export function MaterialsList({ materials }: { materials: MaterialWithExtras[] }) {
  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No materials uploaded yet. Add your lecture notes or slides to get started.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {materials.map((material) => (
        <li key={material.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{material.title}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {material.file_type.toUpperCase()}
              {material.error_message ? ` — ${material.error_message}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {material.status === "ready" && (
              <>
                <Link
                  href={`/dashboard/courses/${material.course_id}/materials/${material.id}/lesson`}
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Lesson
                </Link>
                <Link
                  href={`/dashboard/courses/${material.course_id}/materials/${material.id}/summary`}
                  className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Summary
                </Link>
                {material.quizId && (
                  <Link
                    href={`/dashboard/courses/${material.course_id}/quizzes/${material.quizId}`}
                    className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Quiz
                  </Link>
                )}
              </>
            )}
            {material.lesson && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${LESSON_STATUS_STYLES[material.lesson.status]}`}
              >
                {LESSON_STATUS_LABELS[material.lesson.status]}
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[material.status]}`}
            >
              {STATUS_LABELS[material.status]}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
