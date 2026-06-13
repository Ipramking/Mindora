import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course, Flashcard, FlashcardReview } from "@/lib/supabase/types";
import { ReviewSession } from "@/app/dashboard/courses/[id]/flashcards/review/_components/review-session";
import { PageHero } from "@/components/page-hero";

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
      <PageHero
        seed={course.id}
        backHref={`/dashboard/courses/${course.id}/flashcards`}
        backLabel="Back to flashcards"
        title="Flashcard review"
      />

      <ReviewSession courseId={course.id} cards={cards} />
    </div>
  );
}
