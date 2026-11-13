import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { requireWorkoutData } from "@/features/training/utils/userDataUtils";
import type { Template } from "@/schemas/aiwl.schema";
import { createBranchesBlockHandler } from "./blockHandlers/branches/branchesHandler";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
} from "./blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "./generationInput/generationInput";
import type {
  BlockHandlerRegistry,
  InterpretedWorkout,
} from "./stages/blockWalk";
import {
  createSetListBuilder,
  TRAINING_DAY_SET_LIST_RULES,
} from "./stages/setListBuilding";
import { TRAINING_DAY_FINISH_RULES } from "./stages/workoutFinish";
import {
  createStoredDayWorkout,
  type StoredTrainingDay,
} from "./storedDayWorkout";
import { interpretTemplate } from "./templateInterpreter";

/**
 * A plan training day as the generator runs it: the stored day of a legacy
 * training, or the AIWL workout of an AIWL training.
 */
export type TrainingDay = StoredTrainingDay | Template;

/** True for the AIWL workout of an AIWL training. */
export const isAiwlTrainingDay = (day: TrainingDay): day is Template =>
  "aiwl" in day;

const throwUnreachableTrainingDayBlock = (): never => {
  throw new Error("A training day runs branches blocks only");
};

const UNREACHABLE_TRAINING_DAY_HANDLER = {
  usedBranchScope: "workout",
  handleBlock: throwUnreachableTrainingDayBlock,
} as const;

// A training day holds branches blocks only, so the other handlers throw.
const createTrainingDayHandlers = (
  branches: BlockHandlerRegistry["branches"],
): BlockHandlerRegistry => ({
  picks: UNREACHABLE_TRAINING_DAY_HANDLER,
  branches,
  duration: UNREACHABLE_TRAINING_DAY_HANDLER,
  exercises: UNREACHABLE_TRAINING_DAY_HANDLER,
});

// A legacy training reads its saved copies, which hold every planned branch.
const createLegacyTrainingHandlers = (
  training: StoredTrainingDay,
): BlockHandlerRegistry =>
  createTrainingDayHandlers(
    createBranchesBlockHandler(
      createStoredDayBranchLookup(training.skills),
      "drop",
    ),
  );

// An AIWL training reads the catalog and replaces a branch the catalog lacks.
const AIWL_TRAINING_HANDLERS = createTrainingDayHandlers(
  createBranchesBlockHandler(lookUpStoredBranchInCatalog, "replace"),
);

const runTrainingDayWorkout = (
  workout: InterpretedWorkout,
  input: GenerationInput,
  handlers: BlockHandlerRegistry,
): GeneratedSetListEntry[] => {
  requireWorkoutData(input.athlete);
  return interpretTemplate(workout, input, {
    handlers,
    finishRules: TRAINING_DAY_FINISH_RULES,
    createSetListBuilder: (workoutInput) =>
      createSetListBuilder(workoutInput, TRAINING_DAY_SET_LIST_RULES),
  }).setList;
};

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
): GeneratedSetListEntry[] =>
  runTrainingDayWorkout(
    createStoredDayWorkout(training),
    input,
    createLegacyTrainingHandlers(training),
  );

/**
 * Generates the set list of a plan training day. A legacy training runs
 * its stored day with the branches it saved. An AIWL training runs its workout
 * with the branches of the skill catalog, and a branch ID the catalog lacks
 * draws a replacement from the same skill. Both use the training day set list
 * rules. A block of another kind than branches throws.
 *
 * generateTrainingDay({ aiwl: 1, blocks: [{ kind: "branches", skill: "WU", branches: ["410"], duration: 300 }], ... }, input)
 * → [{ branchId: "410", skill: "WU", set: [1, 1], ... }, ...]
 */
export const generateTrainingDay = (
  day: TrainingDay,
  input: GenerationInput,
): GeneratedSetListEntry[] =>
  isAiwlTrainingDay(day)
    ? runTrainingDayWorkout(day, input, AIWL_TRAINING_HANDLERS)
    : generateTrainingDayFromStoredDay(day, input);
