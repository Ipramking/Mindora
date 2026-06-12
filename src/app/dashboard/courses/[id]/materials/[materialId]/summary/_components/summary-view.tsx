"use client";

import { useState } from "react";
import type { Material, MaterialSummary } from "@/lib/supabase/types";

export function SummaryView({
  materialId,
  materialStatus,
  initialSummary,
}: {
  materialId: string;
  materialStatus: Material["status"];
  initialSummary: MaterialSummary | null;
}) {
  const [summary, setSummary] = useState<MaterialSummary | null>(initialSummary);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/materials/${materialId}/summary`, { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate summary.");
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setPending(false);
    }
  }

  if (materialStatus !== "ready") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          This material is still processing. Summaries are available once it&apos;s ready.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Generating..." : summary ? "Regenerate summary" : "Generate summary"}
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {summary ? (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Summary</h2>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm whitespace-pre-wrap text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {summary.summary}
            </div>
          </section>

          {summary.key_terms.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Glossary</h2>
              <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {summary.key_terms.map((term, i) => (
                  <li key={i} className="px-5 py-4">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{term.term}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{term.definition}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No summary yet — click &quot;Generate summary&quot; to create one from this material.
          </p>
        </div>
      )}
    </div>
  );
}
