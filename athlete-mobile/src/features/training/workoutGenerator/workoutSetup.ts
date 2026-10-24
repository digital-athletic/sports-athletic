import { TagGroups } from "@/constants/tagGroups";
import type { LevelTag } from "@/constants/workoutConstants";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import {
  getBlocksFromPains,
  getPreventionsFromPains,
} from "@/features/training/utils/painUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import { getUserTagValues } from "@/utils/tagUtils";
import type { GenerationInput } from "./generationInput";

// The old generator derives these values per skill from the same athlete and
// place, so one derivation per workout gives the same values.
export interface WorkoutInput extends GenerationInput {
  readonly athleteLevel: LevelTag;
  readonly blockedRegions: readonly string[];
  readonly preventionSkills: readonly string[];
  readonly hasWeights: boolean;
}

const createFrozenList = (list: string[]): readonly string[] =>
  Object.freeze(list);

/**
 * Adds the derived inputs that several blocks share. The muscle soreness
 * check stays in its rule family, which throws only for a skill it filters.
 */
export const setUpWorkout = (input: GenerationInput): WorkoutInput => {
  const pains = getUserTagValues(
    input.athlete.workoutData?.tags,
    TagGroups.PAIN,
  );
  return Object.freeze({
    ...input,
    athleteLevel: getUserLevel(input.athlete),
    blockedRegions: createFrozenList(getBlocksFromPains(pains)),
    preventionSkills: createFrozenList(getPreventionsFromPains(pains)),
    hasWeights: hasWeights(input.equipment),
  });
};
