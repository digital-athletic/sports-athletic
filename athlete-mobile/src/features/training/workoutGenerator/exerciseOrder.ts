import { TagGroups } from "@/constants/tagGroups";
import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { getTagValues } from "@/utils/tagUtils";
import { isBigMuscleExercise } from "./muscleGroups";

const REGION_ROTATION = ["FULL_BODY", "LOWER_BODY", "UPPER_BODY", "CORE"];

/** The skill's order options: max strength puts lower body units first. */
export interface ExerciseUnitOrder {
  lowerBodyFirst: boolean;
  /** The exercise that ended the previous skill. */
  previousExerciseId?: string;
}

interface RegionNarrowing {
  candidates: ExercisePair[];
  rotationIndex: number;
}

const listUnitExercises = (unit: ExercisePair) =>
  unit.second ? [unit.first, unit.second] : [unit.first];

const listUnitTagValues = (unit: ExercisePair, tagGroup: string): string[] =>
  listUnitExercises(unit).flatMap((entry) =>
    getTagValues(entry.branchTags, tagGroup),
  );

const isBigMuscleUnit = (unit: ExercisePair): boolean =>
  listUnitExercises(unit).some(isBigMuscleExercise);

const unitContainsExercise = (
  unit: ExercisePair,
  exerciseId?: string,
): boolean =>
  listUnitExercises(unit).some((entry) => entry.exerciseId === exerciseId);

const unitsShareTagValue = (
  a: ExercisePair,
  b: ExercisePair,
  tagGroup: string,
): boolean => {
  const values = listUnitTagValues(a, tagGroup);
  return listUnitTagValues(b, tagGroup).some((value) => values.includes(value));
};

const isUnitInRegion = (region: string) => (unit: ExercisePair) =>
  listUnitTagValues(unit, TagGroups.REGION).includes(region);

/** Narrows to the matching units, or keeps all when none match: a soft priority. */
const preferUnits = (
  units: ExercisePair[],
  matches: (unit: ExercisePair) => boolean,
): ExercisePair[] => {
  const matching = units.filter(matches);
  return matching.length > 0 ? matching : units;
};

/**
 * Finds the next region in rotation that holds a candidate. The opening pick
 * starts at the first region with a big muscle group unit, so a skill opens
 * with one.
 */
const findNextRegion = (
  candidates: ExercisePair[],
  rotationIndex: number,
  opening: boolean,
): string | undefined => {
  const regions = REGION_ROTATION.map(
    (_, offset) =>
      REGION_ROTATION[(rotationIndex + offset) % REGION_ROTATION.length],
  ).filter((region) => candidates.some(isUnitInRegion(region)));
  const bigRegion = opening
    ? regions.find((region) =>
        candidates.some(
          (unit) => isUnitInRegion(region)(unit) && isBigMuscleUnit(unit),
        ),
      )
    : undefined;
  return bigRegion ?? regions[0];
};

const narrowUnitsBeforeRegion = (
  remaining: ExercisePair[],
  previous: ExercisePair | undefined,
  order: ExerciseUnitOrder,
): ExercisePair[] => {
  const candidates = order.lowerBodyFirst
    ? preferUnits(remaining, isUnitInRegion("LOWER_BODY"))
    : remaining;
  return previous
    ? candidates
    : preferUnits(
        candidates,
        (unit) => !unitContainsExercise(unit, order.previousExerciseId),
      );
};

const narrowUnitsToNextRegion = (
  candidates: ExercisePair[],
  rotationIndex: number,
  opening: boolean,
): RegionNarrowing => {
  const region = findNextRegion(candidates, rotationIndex, opening);
  if (!region) return { candidates, rotationIndex };
  return {
    candidates: candidates.filter(isUnitInRegion(region)),
    rotationIndex: REGION_ROTATION.indexOf(region) + 1,
  };
};

const narrowUnitsAfterRegion = (
  candidates: ExercisePair[],
  previous: ExercisePair | undefined,
): ExercisePair[] => {
  if (!previous) return preferUnits(candidates, isBigMuscleUnit);
  const otherRegion = preferUnits(
    candidates,
    (unit) => !unitsShareTagValue(previous, unit, TagGroups.REGION),
  );
  return preferUnits(
    preferUnits(otherRegion, isBigMuscleUnit),
    (unit) => !unitsShareTagValue(previous, unit, TagGroups.MUSCLE),
  );
};

/**
 * Orders a skill's units by picking one unit at a time. Each pick applies these
 * soft priorities in order, so no unit is ever dropped:
 * 1. Max strength: lower body units while any are left.
 * 2. Opening pick: no unit holding the exercise that ended the previous skill.
 * 3. The next body region in rotation (full body, lower, upper, core); the
 *    opening pick starts at the first region with a big muscle group unit.
 *    Units without a region tag come last.
 * 4. No body region shared with the previous unit.
 * 5. Big muscle groups before small ones inside that region.
 * 6. No primary muscle shared with the previous unit.
 * 7. Uniform random among the rest, one draw per unit.
 * Both exercises of a pair add their regions, muscles and size to the unit.
 */
export const orderExerciseUnits = (
  units: ExercisePair[],
  order: ExerciseUnitOrder,
  random: () => number,
): ExercisePair[] => {
  const remaining = [...units];
  const ordered: ExercisePair[] = [];
  let rotationIndex = 0;
  while (remaining.length > 0) {
    const previous = ordered.at(-1);
    const narrowing = narrowUnitsToNextRegion(
      narrowUnitsBeforeRegion(remaining, previous, order),
      rotationIndex,
      !previous,
    );
    rotationIndex = narrowing.rotationIndex;
    const candidates = narrowUnitsAfterRegion(narrowing.candidates, previous);
    const next = candidates[Math.floor(random() * candidates.length)];
    remaining.splice(remaining.indexOf(next), 1);
    ordered.push(next);
  }
  return ordered;
};

/**
 * Reads the exercise of the last set of the last unit, or the fallback without
 * units.
 *
 * readEndingExerciseId([{ first: push, second: pull }], "e1") → pull.exerciseId
 */
export const readEndingExerciseId = (
  units: ExercisePair[],
  fallback: string | undefined,
): string | undefined => {
  const last = units.at(-1);
  return (last?.second ?? last?.first)?.exerciseId ?? fallback;
};
