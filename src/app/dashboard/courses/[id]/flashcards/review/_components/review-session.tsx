"use client";

import { useState } from "react";
import Link from "next/link";
import type { Flashcard } from "@/lib/supabase/types";
import type { ReviewQuality } from "@/lib/spaced-repetition";

const GRADE_BUTTONS: { quality: ReviewQuality; label: string; className: string }[] = [
  { quality: "again", label: "Again", className: "bg-red-600 hover:bg-red-500" },
  { quality: "good", label: "Good", className: "bg-indigo-600 hover:bg-indigo-500" },
  { quality: "easy", label: "Easy", className: "bg-emerald-600 hover:bg-emerald-500" },
];

export function ReviewSession({ courseId, cards }: { courseId: string; cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">No flashcards are due for review right now.</p>
        <Link
          href={`/dashboard/courses/${courseId}/flashcards`}
          className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to flashcards
        </Link>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          Nice work — you&apos;ve reviewed all {cards.length} due card{cards.length === 1 ? "" : "s"}!
        </p>
        <Link
          href={`/dashboard/courses/${courseId}/flashcards`}
          className="mt-2 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Back to flashcards
        </Link>
      </div>
    );
  }

  const card = cards[index];

  async function handleGrade(quality: ReviewQuality) {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record review.");
      }

      setShowAnswer(false);
      setIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Card {index + 1} of {cards.length}
      </p>

      <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{card.front}</p>
        {showAnswer && (
          <p className="border-t border-zinc-200 pt-4 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            {card.back}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!showAnswer ? (
        <button
          type="button"
          onClick={() => setShowAnswer(true)}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Show answer
        </button>
      ) : (
        <div className="flex gap-2">
          {GRADE_BUTTONS.map((btn) => (
            <button
              key={btn.quality}
              type="button"
              disabled={pending}
              onClick={() => handleGrade(btn.quality)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${btn.className}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
