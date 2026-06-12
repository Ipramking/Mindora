import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatCitation, ChunkMatch } from "@/lib/supabase/types";

const MATCH_COUNT = 6;

export type RetrievedChunk = ChunkMatch & {
  material_title: string;
};

export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  courseId: string,
  queryEmbedding: number[]
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_course_id: courseId,
    match_count: MATCH_COUNT,
  });

  if (error) throw new Error(error.message);

  const matches = data as ChunkMatch[] | null;
  if (!matches || matches.length === 0) return [];

  const materialIds = [...new Set(matches.map((m) => m.material_id))];
  const { data: materials, error: materialsError } = await supabase
    .from("materials")
    .select("id, title")
    .in("id", materialIds)
    .returns<{ id: string; title: string }[]>();

  if (materialsError) throw new Error(materialsError.message);

  const titleById = new Map(materials?.map((m) => [m.id, m.title]) ?? []);

  return matches.map((match) => ({
    ...match,
    material_title: titleById.get(match.material_id) ?? "Untitled material",
  }));
}

export function buildContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant material was found for this question.";
  }

  return chunks
    .map((chunk, i) => {
      const pageInfo = chunk.page_number != null ? `, page ${chunk.page_number}` : "";
      return `[${i + 1}] (${chunk.material_title}${pageInfo})\n${chunk.content}`;
    })
    .join("\n\n");
}

export function toCitations(chunks: RetrievedChunk[]): ChatCitation[] {
  return chunks.map((chunk) => ({
    chunk_id: chunk.id,
    material_id: chunk.material_id,
    material_title: chunk.material_title,
    page_number: chunk.page_number,
  }));
}
