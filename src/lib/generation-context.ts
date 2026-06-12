import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chunk, Material } from "@/lib/supabase/types";

const MAX_CHUNKS = 24;
const MAX_CONTEXT_CHARS = 18000;

export type GenerationContext = {
  context: string;
  scopeLabel: string;
};

export async function getGenerationContext(
  supabase: SupabaseClient,
  courseId: string,
  courseTitle: string,
  materialId: string | null
): Promise<GenerationContext | { error: string; status: number }> {
  let materialTitle: string | null = null;

  if (materialId) {
    const { data: material } = await supabase
      .from("materials")
      .select("id, title")
      .eq("id", materialId)
      .eq("course_id", courseId)
      .single<Pick<Material, "id" | "title">>();

    if (!material) {
      return { error: "Material not found", status: 404 };
    }
    materialTitle = material.title;
  }

  let chunksQuery = supabase
    .from("chunks")
    .select("id, material_id, content, page_number, chunk_index, materials!inner(course_id, status)")
    .eq("materials.course_id", courseId)
    .eq("materials.status", "ready")
    .order("chunk_index", { ascending: true })
    .limit(MAX_CHUNKS);

  if (materialId) {
    chunksQuery = chunksQuery.eq("material_id", materialId);
  }

  const { data: chunks, error: chunksError } = await chunksQuery.returns<
    Pick<Chunk, "id" | "material_id" | "content" | "page_number" | "chunk_index">[]
  >();

  if (chunksError) {
    return { error: chunksError.message, status: 500 };
  }

  if (!chunks || chunks.length === 0) {
    return { error: "No processed materials found to generate from.", status: 400 };
  }

  let context = "";
  for (const chunk of chunks) {
    if (context.length + chunk.content.length > MAX_CONTEXT_CHARS) break;
    context += `${chunk.content}\n\n`;
  }

  return { context, scopeLabel: materialTitle ?? courseTitle };
}
