"use client";

import { useState } from "react";
import type { Lesson, Material } from "@/lib/supabase/types";

export function LessonView({
  materialId,
  materialStatus,
  initialLesson,
}: {
  materialId: string;
  materialStatus: Material["status"];
  initialLesson: Lesson | null;
}) {
  const [lesson, setLesson] = useState<Lesson | null>(initialLesson);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/materials/${materialId}/lesson`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate lesson.");
      }

      setLesson(data.lesson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate lesson.");
    } finally {
      setPending(false);
    }
  }

  if (materialStatus !== "ready") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          This material is still processing. The lesson will be available once it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending || lesson?.status === "processing"}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending || lesson?.status === "processing"
          ? "Generating..."
          : lesson
            ? "Regenerate lesson"
            : "Generate lesson"}
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {lesson?.status === "error" && lesson.error_message && (
        <p className="text-sm text-red-600 dark:text-red-400">{lesson.error_message}</p>
      )}

      {lesson?.status === "ready" && lesson.content ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm whitespace-pre-wrap text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {lesson.content}
        </section>
      ) : lesson?.status === "processing" ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            Your lesson is being written — this can take a minute. Refresh to check progress.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No lesson yet — click &quot;Generate lesson&quot; to create one from this material.
          </p>
        </div>
      )}
    </div>
  );
}
