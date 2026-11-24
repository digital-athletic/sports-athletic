import { TagGroups } from "@/constants/tagGroups";
import type { LevelTag } from "@/constants/workoutConstants";
import { hasWeights } from "@/features/training/utils/equipmentUtils";
import {
  getBlocksFromPains,
  getPreventionsFromPains,
} from "@/features/training/utils/painUtils";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import type { Block } from "@/schemas/aiwl.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { getUserTagValues } from "@/utils/tagUtils";
import {
  createEmptyPicksWorkout,
  type PicksWorkout,
  resolvePicksWorkout,
} from "../blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import type { WorkoutFilters } from "../workoutFilters";
import type { InterpretedWorkout } from "./blockWalk";

// The old generator derives these values per skill from the same athlete and
// place, so one derivation per workout gives the same values.
export interface WorkoutInput extends GenerationInput {
  readonly athleteLevel: LevelTag;
  readonly blockedRegions: readonly string[];
  readonly preventionSkills: readonly string[];
  readonly hasWeights: boolean;
  readonly filters: WorkoutFilters;
  readonly picksWorkout: PicksWorkout;
  /**
   * "blockedSlots" refills a blocked branch in its own slot; the branches
   * handler sets it for a block with `pickedFrom`.
   */
  readonly branchRefill?: "blockedSlots";
  /** The pool of each branches block with `pickedFrom`. */
  readonly replacementPools?: ReadonlyMap<Block, SkillTreeType>;
  /** The pool of the block that runs; a replacement draws only from it. */
  readonly replacementPool?: SkillTreeType;
}

const createFrozenList = (list: string[]): readonly string[] =>
  Object.freeze(list);

/**
 * Adds the derived inputs that several blocks share and applies the picks
 * workout rules of the template. The muscle soreness check stays in its rule
 * family, which throws only for a skill it filters. Every block reads
 * `filters`, the picks pool filter included.
 */
export const setUpWorkout = (
  input: GenerationInput,
  filters: WorkoutFilters,
  template?: InterpretedWorkout,
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
    filters,
    picksWorkout: template
      ? resolvePicksWorkout(
          template,
          { ...input, athleteLevel },
          filters,
          skillTrees,
        )
      : createEmptyPicksWorkout(),
  });
};
