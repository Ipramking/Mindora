"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Material } from "@/lib/supabase/types";

export function GenerateFlashcardsForm({
  courseId,
  materials,
}: {
  courseId: string;
  materials: Material[];
}) {
  const router = useRouter();
  const [materialId, setMaterialId] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          materialId: materialId || null,
          numCards,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate flashcards.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards.");
    } finally {
      setPending(false);
    }
  }

  if (materials.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          Upload and process a material first, then come back here to generate flashcards.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Scope</span>
          <select
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Whole course</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">Cards</span>
          <select
            value={numCards}
            onChange={(e) => setNumCards(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Generating..." : "Generate flashcards"}
        </button>
      </div>
    </form>
  );
}
