import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Material, MaterialSummary } from "@/lib/supabase/types";
import { SummaryView } from "@/app/dashboard/courses/[id]/materials/[materialId]/summary/_components/summary-view";

export default async function MaterialSummaryPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const { id, materialId } = await params;
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("course_id", id)
    .single<Material>();

  if (!material) {
    notFound();
  }

  const { data: summary } = await supabase
    .from("material_summaries")
    .select("*")
    .eq("material_id", materialId)
    .maybeSingle<MaterialSummary>();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/courses/${id}`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to course
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {material.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Summary &amp; glossary</p>
      </div>

      <SummaryView
        materialId={material.id}
        materialStatus={material.status}
        initialSummary={summary ?? null}
      />
    </div>
  );
}
