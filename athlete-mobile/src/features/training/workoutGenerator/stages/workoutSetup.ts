import { TagGroups } from "@/constants/tagGroups";
import type { LevelTag } from "@/constants/workoutConstants";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import {
  getBlocksFromPains,
  getPreventionsFromPains,
} from "@/features/training/utils/painUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { Template } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getUserTagValues } from "@/utils/tagUtils";
import {
  createEmptySelectionsWorkout,
  type SelectionsWorkout,
  resolveSelectionsWorkout,
} from "../blockHandlers/selections/selectionsWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";

// The old generator derives these values per skill from the same athlete and
// place, so one derivation per workout gives the same values.
export interface WorkoutInput extends GenerationInput {
  readonly athleteLevel: LevelTag;
  readonly blockedRegions: readonly string[];
  readonly preventionSkills: readonly string[];
  readonly hasWeights: boolean;
  readonly selectionsWorkout: SelectionsWorkout;
}

const createFrozenList = (list: string[]): readonly string[] =>
  Object.freeze(list);

/**
 * Adds the derived inputs that several blocks share and applies the
 * selections workout rules of the template. The muscle soreness check stays in its rule
 * family, which throws only for a skill it filters.
 */
export const setUpWorkout = (
  input: GenerationInput,
  template?: Template,
  skillTrees?: Readonly<Record<string, SkillTreeType>>,
): WorkoutInput => {
  const pains = getUserTagValues(
    input.athlete.workoutData?.tags,
    TagGroups.PAIN,
  );
  const athleteLevel = getUserLevel(input.athlete);
  return Object.freeze({
    ...input,
    athleteLevel,
    blockedRegions: createFrozenList(getBlocksFromPains(pains)),
    preventionSkills: createFrozenList(getPreventionsFromPains(pains)),
    hasWeights: hasWeights(input.equipment),
    selectionsWorkout: template
      ? resolveSelectionsWorkout(
          template,
          { ...input, athleteLevel },
          skillTrees,
        )
      : createEmptySelectionsWorkout(),
  });
};
