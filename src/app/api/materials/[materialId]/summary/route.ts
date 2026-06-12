import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { getGenerationContext } from "@/lib/generation-context";
import type { Material, MaterialSummary } from "@/lib/supabase/types";

const SUMMARY_TOOL = {
  name: "create_summary",
  description: "Create a study summary and glossary from the provided course material context.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "A concise, well-organized summary of the key points (a few paragraphs or bullet points).",
      },
      key_terms: {
        type: "array",
        description: "A glossary of important terms introduced in this material.",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            definition: { type: "string" },
          },
          required: ["term", "definition"],
        },
      },
    },
    required: ["summary", "key_terms"],
  },
};

async function loadMaterial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  materialId: string
) {
  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .single<Material>();

  return material;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: summary } = await supabase
    .from("material_summaries")
    .select("*")
    .eq("material_id", materialId)
    .maybeSingle<MaterialSummary>();

  return NextResponse.json({ summary });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const material = await loadMaterial(supabase, materialId);
  if (!material) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  if (material.status !== "ready") {
    return NextResponse.json({ error: "This material isn't ready yet." }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", material.course_id)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const generationContext = await getGenerationContext(supabase, course.id, course.title, materialId);

  if ("error" in generationContext) {
    return NextResponse.json({ error: generationContext.error }, { status: generationContext.status });
  }

  const { context, scopeLabel } = generationContext;
  const anthropic = getAnthropicClient();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system:
        "You are an expert study coach. Write a clear, well-organized summary of the provided course " +
        "material that helps a student review it quickly, and extract a glossary of the most important " +
        "terms with concise definitions grounded in the material.",
      messages: [
        {
          role: "user",
          content: `Summarize this material from "${scopeLabel}" and build a glossary of its key terms:\n\n${context}`,
        },
      ],
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "tool", name: "create_summary" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summary generation failed." },
      { status: 500 }
    );
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "The model did not return a summary." }, { status: 500 });
  }

  const input = toolUse.input as {
    summary: string;
    key_terms: { term: string; definition: string }[];
  };

  const { data: summary, error: upsertError } = await supabase
    .from("material_summaries")
    .upsert(
      {
        material_id: materialId,
        course_id: course.id,
        user_id: userData.user.id,
        summary: input.summary,
        key_terms: input.key_terms ?? [],
      },
      { onConflict: "material_id" }
    )
    .select("*")
    .single<MaterialSummary>();

  if (upsertError || !summary) {
    return NextResponse.json(
      { error: upsertError?.message ?? "Failed to save summary" },
      { status: 500 }
    );
  }

  return NextResponse.json({ summary });
}
