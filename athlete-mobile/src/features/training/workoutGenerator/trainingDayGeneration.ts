import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { requireWorkoutData } from "@/features/training/utils/userDataUtils";
import type { BlockHandlerRegistry } from "./blockWalk";
import { createBranchesBlockHandler } from "./branchesHandler";
import type { GenerationInput } from "./generationInput";
import { createTrainingDaySetListBuilder } from "./setListBuilding";
import {
  createStoredDayTemplate,
  type StoredTrainingDay,
} from "./storedDayTemplate";
import { createStoredDayBranchLookup } from "./storedBranchLookup";
import { interpretTemplate } from "./templateInterpreter";
import { TRAINING_DAY_FINISH_RULES } from "./workoutFinish";

const throwUnreachableTrainingDayBlock = (): never => {
  throw new Error("A training day runs branches blocks only");
};

// The stored day template holds branches blocks only, so the other two
// handlers never run.
const createTrainingDayHandlers = (
  training: StoredTrainingDay,
): BlockHandlerRegistry => ({
  picks: {
    usedBranchScope: "workout",
    handleBlock: throwUnreachableTrainingDayBlock,
  },
  branches: createBranchesBlockHandler(
    createStoredDayBranchLookup(training.skills),
  ),
  duration: {
    usedBranchScope: "workout",
    handleBlock: throwUnreachableTrainingDayBlock,
  },
});

/**
 * Generates the set list of a stored training day. The day's own branch
 * entries supply tags and exercises, so the plan generates from the snapshot
 * it stored. An athlete without workout data throws before any block runs.
 * The trees the replacement reads come from the branch lookup index of the
 * input.
 *
 * generateTrainingDayFromStoredDay({ skills: { WU: [...] }, lengths: { WU: 5 } }, input)
 * → [{ branchId: "431", exerciseId: "431", skill: "WU", set: [1, 2], ... }, ...]
 */
export const generateTrainingDayFromStoredDay = (
  training: StoredTrainingDay,
  input: GenerationInput,
): GeneratedSetListEntry[] => {
  requireWorkoutData(input.athlete);
  return interpretTemplate(createStoredDayTemplate(training), input, {
    handlers: createTrainingDayHandlers(training),
    finishRules: TRAINING_DAY_FINISH_RULES,
    createSetListBuilder: createTrainingDaySetListBuilder,
  }).setList;
};
