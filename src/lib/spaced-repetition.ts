export type ReviewQuality = "again" | "good" | "easy";

const QUALITY_SCORES: Record<ReviewQuality, number> = {
  again: 2,
  good: 4,
  easy: 5,
};

export type ReviewState = {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
};

export function nextReviewState(current: ReviewState, quality: ReviewQuality) {
  const q = QUALITY_SCORES[quality];
  let { ease_factor, interval_days, repetitions } = current;

  if (q < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const due_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000).toISOString();

  return { ease_factor, interval_days, repetitions, due_at };
}
