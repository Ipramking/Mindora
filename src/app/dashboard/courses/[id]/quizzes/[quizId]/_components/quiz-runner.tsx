"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/supabase/types";

type QuestionResult = {
  id: string;
  correct_index: number;
  explanation: string | null;
  selected: number | null;
  correct: boolean;
};

export function QuizRunner({ quizId, questions }: { quizId: string; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; results: QuestionResult[] } | null>(
    null
  );

  const resultById = new Map(result?.results.map((r) => [r.id, r]) ?? []);
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  async function handleSubmit() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit quiz.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setPending(false);
    }
  }

  if (questions.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">This quiz has no questions.</p>
    );
  }

  return (
    <div className="space-y-6">
      {result && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
          <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">
            Score: {result.score} / {result.total}
          </p>
        </div>
      )}

      {questions.map((q, i) => {
        const questionResult = resultById.get(q.id);
        return (
          <div
            key={q.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {i + 1}. {q.question}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((option, optIndex) => {
                const isSelected = answers[q.id] === optIndex;
                let optionStyle =
                  "border-zinc-200 hover:border-indigo-400 dark:border-zinc-700";

                if (questionResult) {
                  if (optIndex === questionResult.correct_index) {
                    optionStyle =
                      "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
                  } else if (optIndex === questionResult.selected) {
                    optionStyle = "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40";
                  }
                } else if (isSelected) {
                  optionStyle = "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40";
                }

                return (
                  <label
                    key={optIndex}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-sm text-zinc-900 transition-colors dark:text-zinc-50 ${optionStyle}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={isSelected}
                      disabled={!!result}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                      className="accent-indigo-600"
                    />
                    {option}
                  </label>
                );
              })}
            </div>

            {questionResult?.explanation && (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {questionResult.correct ? "Correct! " : "Not quite. "}
                </span>
                {questionResult.explanation}
              </p>
            )}
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!result && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit answers"}
        </button>
      )}
    </div>
  );
}
