import { TagGroups } from "@/constants/tagGroups";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { isBigMuscleExercise } from "@/features/training/utils/supersetPairingUtils";
import { getTagValues } from "@/utils/tagUtils";

const REGION_ROTATION = ["FULL_BODY", "LOWER_BODY", "UPPER_BODY", "CORE"];

const unitTagValues = (unit: ExercisePair, tagGroup: string): string[] =>
  [unit.first, unit.second].flatMap((entry) =>
    entry ? getTagValues(entry.branchTags, tagGroup) : [],
  );

const leadRegions = (unit: ExercisePair): string[] =>
  getTagValues(unit.first.branchTags, TagGroups.REGION);

const isBig = (unit: ExercisePair): boolean => isBigMuscleExercise(unit.first);

const sharesPrimaryMuscle = (a: ExercisePair, b: ExercisePair): boolean => {
  const muscles = unitTagValues(a, TagGroups.MUSCLE);
  return unitTagValues(b, TagGroups.MUSCLE).some((muscle) =>
    muscles.includes(muscle),
  );
};

const pickRandom = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

/** Narrows to the matching units, or keeps all when none match: a soft priority. */
const prefer = (
  units: ExercisePair[],
  matches: (unit: ExercisePair) => boolean,
): ExercisePair[] => {
  const matching = units.filter(matches);
  return matching.length > 0 ? matching : units;
};

const inRegion = (region: string) => (unit: ExercisePair) =>
  leadRegions(unit).includes(region);

/**
 * The next region in rotation that holds a candidate. The opening pick starts at
 * the first region with a big muscle group unit, so a skill opens with one.
 */
const nextRegion = (
  candidates: ExercisePair[],
  rotationIndex: number,
  opening: boolean,
): string | undefined => {
  const regions = REGION_ROTATION.map(
    (_, offset) =>
      REGION_ROTATION[(rotationIndex + offset) % REGION_ROTATION.length],
  ).filter((region) => candidates.some(inRegion(region)));
  const bigRegion = opening
    ? regions.find((region) =>
        candidates.some((unit) => inRegion(region)(unit) && isBig(unit)),
      )
    : undefined;
  return bigRegion ?? regions[0];
};

/**
 * Orders a skill's units by picking one unit at a time. Each pick applies these
 * soft priorities in order, so no unit is ever dropped:
 * 1. Max strength: lower body units while any are left.
 * 2. Opening pick: not the exercise that ended the previous skill.
 * 3. The next body region in rotation (full body, lower, upper, core); the
 *    opening pick starts at the first region with a big muscle group unit.
 *    Units without a region tag come last.
 * 4. Big muscle groups before small ones inside that region.
 * 5. No primary muscle shared with the previous unit.
 * 6. Uniform random among the rest.
 * The lead exercise of a unit sets its region and size.
 */
export const orderExerciseUnits = (
  units: ExercisePair[],
  lowerBodyFirst: boolean,
  previousExerciseId?: string,
): ExercisePair[] => {
  const remaining = [...units];
  const ordered: ExercisePair[] = [];
  let rotationIndex = 0;
  while (remaining.length > 0) {
    const previous = ordered.at(-1);
    let candidates = lowerBodyFirst
      ? prefer(remaining, inRegion("LOWER_BODY"))
      : remaining;
    if (!previous) {
      candidates = prefer(
        candidates,
        (unit) => unit.first.exerciseId !== previousExerciseId,
      );
    }
    const region = nextRegion(candidates, rotationIndex, !previous);
    if (region) {
      candidates = candidates.filter(inRegion(region));
      rotationIndex = REGION_ROTATION.indexOf(region) + 1;
    }
    candidates = prefer(candidates, isBig);
    if (previous) {
      candidates = prefer(
        candidates,
        (unit) => !sharesPrimaryMuscle(previous, unit),
      );
    }
    const next = pickRandom(candidates);
    remaining.splice(remaining.indexOf(next), 1);
    ordered.push(next);
  }
  return ordered;
};

/** The exercise of the last set of the last unit, or the fallback without units. */
export const endingExerciseId = (
  units: ExercisePair[],
  fallback: string | undefined,
): string | undefined => {
  const last = units.at(-1);
  return (last?.second ?? last?.first)?.exerciseId ?? fallback;
};
