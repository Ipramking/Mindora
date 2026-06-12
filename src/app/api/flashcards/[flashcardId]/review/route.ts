import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nextReviewState, type ReviewQuality } from "@/lib/spaced-repetition";
import type { FlashcardReview } from "@/lib/supabase/types";

const QUALITIES = new Set<ReviewQuality>(["again", "good", "easy"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flashcardId: string }> }
) {
  const { flashcardId } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const quality = body?.quality;

  if (!QUALITIES.has(quality)) {
    return NextResponse.json({ error: "Invalid quality" }, { status: 400 });
  }

  const { data: review } = await supabase
    .from("flashcard_reviews")
    .select("*")
    .eq("flashcard_id", flashcardId)
    .single<FlashcardReview>();

  if (!review) {
    return NextResponse.json({ error: "Review state not found" }, { status: 404 });
  }

  const next = nextReviewState(review, quality as ReviewQuality);

  const { error: updateError } = await supabase
    .from("flashcard_reviews")
    .update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      due_at: next.due_at,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("flashcard_id", flashcardId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ due_at: next.due_at });
}
