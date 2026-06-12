"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExamDateForm({ courseId, examDate }: { courseId: string; examDate: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(examDate ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(nextValue: string) {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/exam-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: nextValue || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save exam date.");
      }

      setValue(nextValue);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save exam date.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="exam-date" className="text-zinc-500 dark:text-zinc-400">
        Exam date
      </label>
      <input
        id="exam-date"
        type="date"
        value={value}
        disabled={pending}
        onChange={(e) => handleSave(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {value && (
        <button
          type="button"
          onClick={() => handleSave("")}
          disabled={pending}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          Clear
        </button>
      )}
      {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
