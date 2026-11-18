import type { BranchSelectingBlock, PicksBlock } from "@/schemas/aiwl.schema";
import type { SkillCatalog } from "@/schemas/skillCatalog.schema";
import { readResolvedPicksBlockTiming } from "../blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import type { WorkoutInput } from "../stages/workoutSetup";
import { type ResolvedBlockTiming, resolveBlockTiming } from "./blockTiming";
import type { SetListBlock } from "./setListBuilder";
import { readTrainingDayTimingDefaults } from "./trainingDayTiming";

const SECONDS_PER_MINUTE = 60;

const resolveTrainingDayBlockTiming = (
  block: Exclude<BranchSelectingBlock, PicksBlock>,
  skillCatalog: SkillCatalog,
): ResolvedBlockTiming =>
  resolveBlockTiming(
    block,
    readTrainingDayTimingDefaults(block.skill, skillCatalog),
  );

/** The input that resolves a block's timing: the catalog and the picks workout. */
export type BlockTimingInput = GenerationInput &
  Pick<WorkoutInput, "picksWorkout">;

/**
 * Reads the timing of a block. Workout setup resolves picks blocks only, so
 * every other block resolves against the training day defaults of its skill.
 *
 * readBlockTiming({ kind: "branches", skill: "GKS", sets: 3, ... }, input)
 * → { sets: 3, superset: "muscles", rest: { withinSuperset: 10, ... }, ... }
 */
export const readBlockTiming = (
  block: BranchSelectingBlock,
  input: BlockTimingInput,
): ResolvedBlockTiming =>
  block.kind === "picks"
    ? readResolvedPicksBlockTiming(input.picksWorkout, block)
    : resolveTrainingDayBlockTiming(block, input.skillCatalog);

/**
 * Builds the set list block from a block and its resolved timing. The minutes
 * are the stored duration of a branches or duration block, else 0.
 *
 * createSetListBlock({ kind: "duration", skill: "CARDIO_2", duration: 1200, ... }, timing)
 * → { skill: "CARDIO_2", minutes: 20, sets: 1, rest: { ... }, ... }
 */
export const createSetListBlock = (
  block: BranchSelectingBlock,
  timing: ResolvedBlockTiming,
): SetListBlock => {
  const { superset, ...setListTiming } = timing;
  const minutes =
    block.kind === "picks" ? 0 : (block.duration ?? 0) / SECONDS_PER_MINUTE;
  return { skill: block.skill, minutes, ...setListTiming };
};
