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

const sharesPrimaryMuscle = (a: ExercisePair, b: ExercisePair): boolean => {
  const muscles = unitTagValues(a, TagGroups.MUSCLE);
  return unitTagValues(b, TagGroups.MUSCLE).some((muscle) =>
    muscles.includes(muscle),
  );
};

const pickRandom = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

/**
 * Sequences units by soft priorities: rotate body regions (full body, lower,
 * upper, core) and avoid the previous unit's primary muscles. Nothing is dropped.
 */
const rotateRegions = (
  units: ExercisePair[],
  state: { rotationIndex: number; previous?: ExercisePair },
): ExercisePair[] => {
  const remaining = [...units];
  const ordered: ExercisePair[] = [];
  while (remaining.length > 0) {
    const region = REGION_ROTATION.map(
      (_, offset) =>
        REGION_ROTATION[
          (state.rotationIndex + offset) % REGION_ROTATION.length
        ],
    ).find((candidate) =>
      remaining.some((unit) => leadRegions(unit).includes(candidate)),
    );
    const inRegion = region
      ? remaining.filter((unit) => leadRegions(unit).includes(region))
      : remaining;
    const previous = state.previous;
    const freshMuscles = previous
      ? inRegion.filter((unit) => !sharesPrimaryMuscle(previous, unit))
      : inRegion;
    const next = pickRandom(freshMuscles.length > 0 ? freshMuscles : inRegion);

    remaining.splice(remaining.indexOf(next), 1);
    ordered.push(next);
    state.previous = next;
    if (region) {
      state.rotationIndex = REGION_ROTATION.indexOf(region) + 1;
    }
  }
  return ordered;
};

/**
 * Orders a skill's units: big muscle groups before the rest, each group
 * sequenced by region rotation. Max strength puts lower body main lifts first.
 */
export const orderExerciseUnits = (
  units: ExercisePair[],
  lowerBodyFirst: boolean,
): ExercisePair[] => {
  const state: { rotationIndex: number; previous?: ExercisePair } = {
    rotationIndex: 0,
  };
  const orderBySize = (group: ExercisePair[]) => [
    ...rotateRegions(
      group.filter((unit) => isBigMuscleExercise(unit.first)),
      state,
    ),
    ...rotateRegions(
      group.filter((unit) => !isBigMuscleExercise(unit.first)),
      state,
    ),
  ];
  if (!lowerBodyFirst) {
    return orderBySize(units);
  }
  const isLowerBody = (unit: ExercisePair) =>
    leadRegions(unit).includes("LOWER_BODY");
  return [
    ...orderBySize(units.filter(isLowerBody)),
    ...orderBySize(units.filter((unit) => !isLowerBody(unit))),
  ];
};
