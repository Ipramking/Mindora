import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { getGenerationContext } from "@/lib/generation-context";

const CARD_COUNTS = new Set([5, 10, 20]);

const FLASHCARD_TOOL = {
  name: "create_flashcards",
  description: "Create flashcards from the provided course material context.",
  input_schema: {
    type: "object" as const,
    properties: {
      flashcards: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            front: { type: "string", description: "The term, question, or prompt." },
            back: { type: "string", description: "The definition, answer, or explanation." },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["flashcards"],
  },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.courseId;
  const materialId = body?.materialId ?? null;
  const numCards = body?.numCards;

  if (typeof courseId !== "string" || !CARD_COUNTS.has(numCards)) {
    return NextResponse.json({ error: "Missing courseId or invalid numCards" }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const generationContext = await getGenerationContext(
    supabase,
    courseId,
    course.title,
    typeof materialId === "string" ? materialId : null
  );

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
        "You are an expert study coach. Create concise, high-yield flashcards from the provided " +
        "course material. Each flashcard should have a short 'front' (a term or question) and a " +
        "clear 'back' (the definition or answer). Avoid duplicates and cover distinct concepts.",
      messages: [
        {
          role: "user",
          content: `Create ${numCards} flashcards covering the key concepts in this material from "${scopeLabel}":\n\n${context}`,
        },
      ],
      tools: [FLASHCARD_TOOL],
      tool_choice: { type: "tool", name: "create_flashcards" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Flashcard generation failed." },
      { status: 500 }
    );
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "The model did not return flashcards." }, { status: 500 });
  }

  const input = toolUse.input as {
    flashcards: { front: string; back: string }[];
  };

  if (!input.flashcards || input.flashcards.length === 0) {
    return NextResponse.json({ error: "The model returned no flashcards." }, { status: 500 });
  }

  const { data: cards, error: cardsError } = await supabase
    .from("flashcards")
    .insert(
      input.flashcards.map((c) => ({
        course_id: courseId,
        user_id: userData.user.id,
        material_id: typeof materialId === "string" ? materialId : null,
        front: c.front,
        back: c.back,
      }))
    )
    .select("id");

  if (cardsError || !cards) {
    return NextResponse.json(
      { error: cardsError?.message ?? "Failed to create flashcards" },
      { status: 500 }
    );
  }

  const { error: reviewsError } = await supabase.from("flashcard_reviews").insert(
    cards.map((c) => ({
      flashcard_id: c.id,
      user_id: userData.user.id,
    }))
  );

  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 500 });
  }

  return NextResponse.json({ count: cards.length });
}
