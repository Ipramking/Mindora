import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { getGenerationContext } from "@/lib/generation-context";
import type { Lesson, Material } from "@/lib/supabase/types";

export const maxDuration = 60;

const LESSON_SYSTEM_PROMPT = `You are Mindora, an expert university course writer. Turn the provided source \
material into a long, thorough lesson that fully teaches the material — a student should be able to learn \
the subject from your lesson alone, without re-reading the source.

Structure the lesson in Markdown with:
- A short "Overview" section stating what the student will learn.
- Multiple "##" sections, one per major topic, each explaining the concept in depth with clear language and examples.
- For ANY topic involving formulas, equations, quantitative reasoning, or calculations, include fully worked \
numerical examples showing every step (set up the formula, substitute values, compute, state units and the final answer).
- A closing "## Practice Problems" section with at least 4 problems for the student to attempt themselves \
(including calculation problems where the subject is quantitative), each followed by a complete worked solution.

Be thorough and detailed rather than brief — this should read like a textbook chapter, not a summary.`;

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

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("material_id", materialId)
    .maybeSingle<Lesson>();

  return NextResponse.json({ lesson });
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
  const title = `Lesson: ${scopeLabel}`;

  await supabase
    .from("lessons")
    .upsert(
      {
        material_id: materialId,
        course_id: course.id,
        user_id: userData.user.id,
        title,
        status: "processing",
        error_message: null,
      },
      { onConflict: "material_id" }
    );

  const anthropic = getAnthropicClient();

  let content: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: LESSON_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Write a complete lesson covering this material from "${scopeLabel}":\n\n${context}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
      throw new Error("The model did not return a lesson.");
    }
    content = textBlock.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lesson generation failed.";
    await supabase
      .from("lessons")
      .update({ status: "error", error_message: message })
      .eq("material_id", materialId);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: lesson, error: updateError } = await supabase
    .from("lessons")
    .update({ content, status: "ready", error_message: null })
    .eq("material_id", materialId)
    .select("*")
    .single<Lesson>();

  if (updateError || !lesson) {
    return NextResponse.json(
      { error: updateError?.message ?? "Failed to save lesson" },
      { status: 500 }
    );
  }

  return NextResponse.json({ lesson });
}
