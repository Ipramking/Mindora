import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { getGenerationContext } from "@/lib/generation-context";

export const maxDuration = 60;

const QUESTION_COUNTS = new Set([3, 5, 10]);

const QUIZ_TOOL = {
  name: "create_quiz",
  description: "Create a multiple-choice quiz from the provided course material context.",
  input_schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            question: { type: "string", description: "The question text." },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
              description: "Exactly four answer options.",
            },
            correct_index: {
              type: "integer",
              minimum: 0,
              maximum: 3,
              description: "Index (0-3) of the correct option.",
            },
            explanation: {
              type: "string",
              description: "Brief explanation of why the correct answer is right.",
            },
          },
          required: ["question", "options", "correct_index", "explanation"],
        },
      },
    },
    required: ["questions"],
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
  const numQuestions = body?.numQuestions;

  if (typeof courseId !== "string" || !QUESTION_COUNTS.has(numQuestions)) {
    return NextResponse.json({ error: "Missing courseId or invalid numQuestions" }, { status: 400 });
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
        "You are an expert university quiz writer. Write clear, fair multiple-choice questions " +
        "based only on the provided course material. Each question must have exactly 4 options " +
        "with exactly one correct answer, and a short explanation of the correct answer.",
      messages: [
        {
          role: "user",
          content: `Create ${numQuestions} multiple-choice questions covering the key concepts in this material from "${scopeLabel}":\n\n${context}`,
        },
      ],
      tools: [QUIZ_TOOL],
      tool_choice: { type: "tool", name: "create_quiz" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quiz generation failed." },
      { status: 500 }
    );
  }

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "The model did not return a quiz." }, { status: 500 });
  }

  const input = toolUse.input as {
    questions: {
      question: string;
      options: string[];
      correct_index: number;
      explanation: string;
    }[];
  };

  if (!input.questions || input.questions.length === 0) {
    return NextResponse.json({ error: "The model returned no questions." }, { status: 500 });
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      course_id: courseId,
      user_id: userData.user.id,
      material_id: materialId,
      title: `Quiz: ${scopeLabel}`,
    })
    .select("*")
    .single();

  if (quizError || !quiz) {
    return NextResponse.json(
      { error: quizError?.message ?? "Failed to create quiz" },
      { status: 500 }
    );
  }

  const { error: questionsError } = await supabase.from("quiz_questions").insert(
    input.questions.map((q, i) => ({
      quiz_id: quiz.id,
      question_index: i,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
    }))
  );

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: quiz.id });
}
