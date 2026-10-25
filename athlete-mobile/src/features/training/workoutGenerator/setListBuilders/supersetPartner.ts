import { TagGroups } from "@/constants/tagGroups";
import type { BranchExerciseReference } from "@/features/training/models/ExerciseBranch";
import { getOpposingExerciseDirection } from "@/features/training/utils/exerciseUtils";
import { getTagValues } from "@/utils/tagUtils";
import { isBigMuscleExercise, readPrimaryMuscleGroups } from "./muscleGroups";

const ONE_SIDED = ["ONE", "LEFT", "RIGHT"];

// Only directions with an opposite name a movement pattern; LOWER_BODY or CORE do not
const listMovementPatterns = (entry: BranchExerciseReference): string[] =>
  getTagValues(entry.branchTags, TagGroups.EXERCISE_DIRECTION).filter(
    (direction) => getOpposingExerciseDirection(direction) !== "",
  );

const sharesAnyValue = (a: string[], b: string[]): boolean =>
  a.some((value) => b.includes(value));

const isBothSidedExercise = (entry: BranchExerciseReference): boolean =>
  !sharesAnyValue(getTagValues(entry.branchTags, TagGroups.SIDE), ONE_SIDED);

const isExcludedSupersetPartner = (
  lead: BranchExerciseReference,
  candidate: BranchExerciseReference,
): boolean =>
  !isBothSidedExercise(candidate) ||
  candidate.exerciseId === lead.exerciseId ||
  sharesAnyValue(listMovementPatterns(candidate), listMovementPatterns(lead)) ||
  sharesAnyValue(
    readPrimaryMuscleGroups(candidate),
    readPrimaryMuscleGroups(lead),
  );

/**
 * Ranks a superset partner, 1 is best: opposing muscle, then big muscle from
 * another region, big from the same region, small from another, small from the
 * same. Returns null for an excluded partner: one sided, the lead's own
 * exercise, a shared movement pattern or a shared primary muscle group.
 */
export const rankSupersetPartner = (
  lead: BranchExerciseReference,
  candidate: BranchExerciseReference,
  opposingMuscles: string[],
): number | null => {
  if (isExcludedSupersetPartner(lead, candidate)) return null;
  if (sharesAnyValue(readPrimaryMuscleGroups(candidate), opposingMuscles)) {
    return 1;
  }
  const sameRegion = sharesAnyValue(
    getTagValues(candidate.branchTags, TagGroups.REGION),
    getTagValues(lead.branchTags, TagGroups.REGION),
  );
  return (isBigMuscleExercise(candidate) ? 2 : 4) + (sameRegion ? 1 : 0);
};

/**
 * Picks the best ranked partner and breaks ties uniformly at random. Draws
 * once when a partner qualifies, never otherwise.
 */
export const pickSupersetPartner = (
  lead: BranchExerciseReference,
  candidates: BranchExerciseReference[],
  opposingMuscles: string[],
  random: () => number,
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
  return best.length > 0 ? best[Math.floor(random() * best.length)] : undefined;
};
