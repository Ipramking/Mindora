import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Flashcard, FlashcardReview } from "@/lib/supabase/types";
import { ReviewSession } from "@/app/dashboard/courses/[id]/flashcards/review/_components/review-session";

export default async function FlashcardsReviewPage({
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

  const { data: dueReviews } = await supabase
    .from("flashcard_reviews")
    .select("flashcard_id")
    .lte("due_at", new Date().toISOString())
    .returns<Pick<FlashcardReview, "flashcard_id">[]>();

  const dueIds = (dueReviews ?? []).map((r) => r.flashcard_id);

  let cards: Flashcard[] = [];
  if (dueIds.length > 0) {
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("course_id", id)
      .in("id", dueIds)
      .returns<Flashcard[]>();
    cards = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/courses/${course.id}/flashcards`}
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to flashcards
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Flashcard review
        </h1>
      </div>

      <ReviewSession courseId={course.id} cards={cards} />
    </div>
  );
}
