import { WorkoutConstants } from "@/constants/workoutConstants";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { requireWorkoutData } from "@/features/training/utils/userDataUtils";
import type { Block, Template } from "@/schemas/aiwl.schema";
import { createBranchesBlockHandler } from "./blockHandlers/branches/branchesHandler";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
} from "./blockHandlers/branches/storedBranchLookup";
import { SHORT_WORKOUT_PICKS_POOL_RULES } from "./blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "./generationInput/generationInput";
import type {
  BlockHandlerRegistry,
  InterpretedWorkout,
} from "./stages/blockWalk";
import { createSetListBuilder } from "./stages/setListBuilding";
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

// A training day holds branches blocks only, so the other handlers throw.
const createTrainingDayHandlers = (
  branches: BlockHandlerRegistry["branches"],
): BlockHandlerRegistry => ({
  picks: throwUnreachableTrainingDayBlock,
  branches,
  duration: throwUnreachableTrainingDayBlock,
  exercises: throwUnreachableTrainingDayBlock,
});

// A legacy training reads its saved copies, which hold every planned branch.
const createLegacyTrainingHandlers = (
  training: StoredTrainingDay,
): BlockHandlerRegistry =>
  createTrainingDayHandlers(
    createBranchesBlockHandler(createStoredDayBranchLookup(training.skills)),
  );

// An AIWL training reads the catalog.
const AIWL_TRAINING_HANDLERS = createTrainingDayHandlers(
  createBranchesBlockHandler(lookUpStoredBranchInCatalog),
);

// Stable; a skill missing from SECTION_ORDER has index -1 and sorts first.
const sortBlocksBySectionOrder = <TBlock extends Block>(
  blocks: readonly TBlock[],
): TBlock[] =>
  [...blocks].sort(
    (a, b) =>
      WorkoutConstants.SECTION_ORDER.indexOf(a.skill) -
      WorkoutConstants.SECTION_ORDER.indexOf(b.skill),
  );

// The plan generator writes an AIWL day in skill priority order, so both day
// shapes run their blocks sorted by section order.
const runTrainingDayWorkout = (
  workout: InterpretedWorkout,
  input: GenerationInput,
  handlers: BlockHandlerRegistry,
): GeneratedSetListEntry[] => {
  requireWorkoutData(input.athlete);
  const sortedWorkout = {
    ...workout,
    blocks: sortBlocksBySectionOrder(workout.blocks),
  };
  return interpretTemplate(sortedWorkout, input, {
    handlers,
    finishRules: { requiredBlocks: "none" },
    createSetListBuilder,
    picksPoolRules: SHORT_WORKOUT_PICKS_POOL_RULES,
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
 * draws a replacement from the same skill. Both shapes run their blocks in
 * section order. A block of another kind than branches throws.
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
