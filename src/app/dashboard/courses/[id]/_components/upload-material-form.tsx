"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED = ".pdf,.docx,.txt,.md";

export function UploadMaterialForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) {
      setError("Please choose a file.");
      return;
    }

    setPending(true);
    setError(null);

    const body = new FormData();
    body.set("file", file);
    body.set("courseId", courseId);

    try {
      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed.");
      }

      const data = await res.json().catch(() => ({}));
      const materialId = data?.id;

      if (typeof materialId === "string") {
        // Kick off lesson + quiz generation in the background. These run as
        // separate requests so they aren't bound by the upload request's
        // timeout, and the user doesn't have to trigger them manually.
        fetch(`/api/materials/${materialId}/lesson`, { method: "POST" }).catch(() => {});
        fetch("/api/quizzes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, materialId, numQuestions: 10 }),
        }).catch(() => {});
      }

      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">Upload a material</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">PDF, DOCX, TXT, or Markdown</p>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept={ACCEPTED}
          required
          className="text-sm text-zinc-600 dark:text-zinc-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
