/**
 * Scripted feedback strategies for the progression simulator. A script decides
 * what difficulty an athlete reports for an exercise in a given session, which
 * drives the inter-session weight/level adjustment.
 */
import type { ExerciseDifficultyType } from "@/constants/workoutConstants";

export interface FeedbackContext {
  /** 1-based session index. */
  session: number;
}

export type FeedbackScript = (ctx: FeedbackContext) => ExerciseDifficultyType;

/** Reports "zu leicht" every session; used to probe meso-responsiveness. */
export const alwaysTooEasy: FeedbackScript = () => "TOO_EASY";

export const alwaysSucceeded: FeedbackScript = () => "SUCCEEDED";

export const alwaysTooHard: FeedbackScript = () => "TOO_HARD";
