import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { getOpposingExerciseDirection } from "@/features/training/utils/exerciseUtils";
import { getTagValues } from "@/utils/tagUtils";

const ONE_SIDED = ["ONE", "LEFT", "RIGHT"];

// Side-specific muscles count per side, so QUADRICEPS_LEFT is the quadriceps group
const muscleGroupOf = (muscle: string): string =>
  muscle.replace(/_(LEFT|RIGHT)$/, "");

const primaryMuscleGroups = (entry: BranchExerciseReference): string[] =>
  getTagValues(entry.branchTags, TagGroups.MUSCLE).map(muscleGroupOf);

// Only directions with an opposite name a movement pattern; LOWER_BODY or CORE do not
const movementPatterns = (entry: BranchExerciseReference): string[] =>
  getTagValues(entry.branchTags, TagGroups.EXERCISE_DIRECTION).filter(
    (direction) => getOpposingExerciseDirection(direction) !== "",
  );

const sharesAny = (a: string[], b: string[]): boolean =>
  a.some((value) => b.includes(value));

export const isBigMuscleExercise = (entry: BranchExerciseReference): boolean =>
  primaryMuscleGroups(entry).some((muscle) =>
    WorkoutConstants.BIG_MUSCLES.includes(muscle),
  );

export const isBothSided = (entry: BranchExerciseReference): boolean =>
  !sharesAny(getTagValues(entry.branchTags, TagGroups.SIDE), ONE_SIDED);

/**
 * Rank of a superset partner, 1 is best: opposing muscle, then big muscle from
 * another region, big from the same region, small from another, small from the same.
 * Returns null for an excluded partner.
 */
export const rankSupersetPartner = (
  lead: BranchExerciseReference,
  candidate: BranchExerciseReference,
  opposingMuscles: string[],
): number | null => {
  if (
    !isBothSided(candidate) ||
    candidate.exerciseId === lead.exerciseId ||
    sharesAny(movementPatterns(candidate), movementPatterns(lead))
  ) {
    return null;
  }
  const candidateMuscles = primaryMuscleGroups(candidate);
  if (sharesAny(candidateMuscles, primaryMuscleGroups(lead))) {
    return null;
  }
  if (sharesAny(candidateMuscles, opposingMuscles)) {
    return 1;
  }
  const sameRegion = sharesAny(
    getTagValues(candidate.branchTags, TagGroups.REGION),
    getTagValues(lead.branchTags, TagGroups.REGION),
  );
  return (isBigMuscleExercise(candidate) ? 2 : 4) + (sameRegion ? 1 : 0);
};

/**
 * Picks the best ranked partner, breaking ties uniformly at random.
 */
export const pickSupersetPartner = (
  lead: BranchExerciseReference,
  candidates: BranchExerciseReference[],
  opposingMuscles: string[],
): BranchExerciseReference | undefined => {
  let bestRank = Number.POSITIVE_INFINITY;
  let best: BranchExerciseReference[] = [];
  for (const candidate of candidates) {
    const rank = rankSupersetPartner(lead, candidate, opposingMuscles);
    if (rank === null || rank > bestRank) continue;
    if (rank < bestRank) {
      bestRank = rank;
      best = [];
    }
    best.push(candidate);
  }
  return best.length > 0
    ? best[Math.floor(Math.random() * best.length)]
    : undefined;
};
