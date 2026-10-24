import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { getTagValues } from "@/utils/tagUtils";

/**
 * Reads the primary muscle groups of a branch reference. Side-specific muscles
 * count per side, so QUADRICEPS_LEFT is the quadriceps group.
 *
 * readPrimaryMuscleGroups({ branchTags: ["MUSCLE_QUADRICEPS_LEFT", "MUSCLE_CALF"], ... })
 * → ["QUADRICEPS", "CALF"]
 */
export const readPrimaryMuscleGroups = (
  entry: BranchExerciseReference,
): string[] =>
  getTagValues(entry.branchTags, TagGroups.MUSCLE).map((muscle) =>
    muscle.replace(/_(LEFT|RIGHT)$/, ""),
  );

/** True when the exercise trains a big muscle group as a primary muscle. */
export const isBigMuscleExercise = (entry: BranchExerciseReference): boolean =>
  readPrimaryMuscleGroups(entry).some((muscle) =>
    WorkoutConstants.BIG_MUSCLES.includes(muscle),
  );
