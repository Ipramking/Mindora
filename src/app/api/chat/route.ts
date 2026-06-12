import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, TONE_INSTRUCTIONS, TUTOR_SYSTEM_PROMPT } from "@/lib/anthropic";
import { embedQuery } from "@/lib/ingestion";
import { buildContext, retrieveRelevantChunks, toCitations } from "@/lib/retrieval";
import type { ChatMessage, ChatTone } from "@/lib/supabase/types";

const HISTORY_LIMIT = 10;
const VALID_TONES = new Set<ChatTone>(["explain_like_5", "standard", "expert"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseId = body?.courseId;
  const message = body?.message;
  let sessionId = body?.sessionId;
  const requestedTone = body?.tone;

  if (typeof courseId !== "string" || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Missing courseId or message" }, { status: 400 });
  }

  const tone: ChatTone = VALID_TONES.has(requestedTone) ? requestedTone : "standard";

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (typeof sessionId !== "string") {
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .insert({ course_id: courseId, user_id: userData.user.id, tone })
      .select("id")
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: sessionError?.message ?? "Failed to start chat session" },
        { status: 500 }
      );
    }

    sessionId = session.id;
  } else if (typeof requestedTone === "string" && VALID_TONES.has(requestedTone as ChatTone)) {
    await supabase.from("chat_sessions").update({ tone }).eq("id", sessionId);
  }

  const { data: history } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT)
    .returns<ChatMessage[]>();

  const { error: userMessageError } = await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  if (userMessageError) {
    return NextResponse.json({ error: userMessageError.message }, { status: 500 });
  }

  let citations: ReturnType<typeof toCitations> = [];
  let context = "No relevant material was found for this question.";

  try {
    const queryEmbedding = await embedQuery(message);
    const chunks = await retrieveRelevantChunks(supabase, courseId, queryEmbedding);
    citations = toCitations(chunks);
    context = buildContext(chunks);
  } catch {
    // Retrieval failures shouldn't block the chat; fall back to no-context answer.
  }

  const conversationHistory = (history ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const anthropic = getAnthropicClient();
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: `${TUTOR_SYSTEM_PROMPT}\n\nTone for this conversation: ${TONE_INSTRUCTIONS[tone]}\n\nNumbered sources for this question:\n${context}`,
    messages: [...conversationHistory, { role: "user", content: message }],
  });

  const encoder = new TextEncoder();
  const body_ = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        controller.enqueue(encoder.encode(`\n\n_Error: ${message}_`));
        fullText += `\n\n_Error: ${message}_`;
      }

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: fullText,
        cited_chunks: citations.length > 0 ? citations : null,
      });

      controller.close();
    },
  });

  return new Response(body_, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Chat-Session-Id": sessionId,
      "X-Chat-Citations": Buffer.from(JSON.stringify(citations)).toString("base64"),
    },
  });
}
