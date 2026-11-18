import { WorkoutConstants } from "@/constants/workoutConstants";
import type { Block, Template } from "@/schemas/aiwl.schema";
import {
  createStoredDayBranchLookup,
  lookUpStoredBranchInCatalog,
} from "./blockHandlers/branches/storedBranchLookup";
import {
  createStoredDayWorkout,
  type StoredTrainingDay,
} from "./storedDayWorkout";
import type { SelectedWorkout } from "./workoutGeneration";

/**
 * A plan training day as the generator runs it: the stored day of a legacy
 * training, or the AIWL workout of an AIWL training.
 */
export type TrainingDay = StoredTrainingDay | Template;

/** True for the AIWL workout of an AIWL training. */
export const isAiwlTrainingDay = (day: TrainingDay): day is Template =>
  "aiwl" in day;

// Stable; a skill missing from SECTION_ORDER has index -1 and sorts first.
const sortBlocksBySectionOrder = <TBlock extends Block>(
  blocks: readonly TBlock[],
): TBlock[] =>
  [...blocks].sort(
    (a, b) =>
      WorkoutConstants.SECTION_ORDER.indexOf(a.skill) -
      WorkoutConstants.SECTION_ORDER.indexOf(b.skill),
  );

/**
 * Reads the workout and the branch lookup of a plan training day, with its
 * blocks sorted by section order. The plan generator writes an AIWL day in
 * skill priority order, so both day shapes need the sort. An AIWL day reads
 * its branches from the catalog, a legacy day from the copies it saved.
 *
 * readTrainingDayWorkout({ skills: { CD: [...], WU: [...] }, lengths: {} })
 * → { workout: { id: "TRAINING_DAY", blocks: [WU block, CD block] },
 *     lookUpBranch: <reads the saved copies> }
 */
export const readTrainingDayWorkout = (day: TrainingDay): SelectedWorkout => {
  if (isAiwlTrainingDay(day)) {
    return {
      workout: { ...day, blocks: sortBlocksBySectionOrder(day.blocks) },
      lookUpBranch: lookUpStoredBranchInCatalog,
    };
  }
  const storedDayWorkout = createStoredDayWorkout(day);
  return {
    workout: {
      ...storedDayWorkout,
      blocks: sortBlocksBySectionOrder(storedDayWorkout.blocks),
    },
    lookUpBranch: createStoredDayBranchLookup(day.skills),
  };
};
