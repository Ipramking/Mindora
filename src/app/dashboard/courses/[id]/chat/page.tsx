import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatSession, Course } from "@/lib/supabase/types";
import { ChatPanel } from "@/app/dashboard/courses/[id]/chat/_components/chat-panel";
import { PageHero } from "@/components/page-hero";

export default async function CourseChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single<Course>();

  if (!course) {
    notFound();
  }

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ChatSession>();

  let messages: ChatMessage[] = [];
  if (session) {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .returns<ChatMessage[]>();
    messages = data ?? [];
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[24rem] flex-col gap-4 sm:h-[calc(100vh-12rem)]">
      <PageHero
        seed={course.id}
        backHref={`/dashboard/courses/${course.id}`}
        backLabel={`Back to ${course.title}`}
        title="Tutor chat"
      />

      <ChatPanel
        courseId={course.id}
        initialSessionId={session?.id ?? null}
        initialMessages={messages}
        initialTone={session?.tone ?? "standard"}
      />
    </div>
  );
}
