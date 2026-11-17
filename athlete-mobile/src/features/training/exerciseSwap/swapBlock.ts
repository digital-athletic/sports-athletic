import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { readResolvedPicksBlockTiming } from "@/features/training/workoutGenerator/blockHandlers/picks/picksWorkoutRules";
import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import {
  setUpWorkout,
  type WorkoutInput,
} from "@/features/training/workoutGenerator/stages/workoutSetup";
import { createStoredDayWorkout } from "@/features/training/workoutGenerator/storedDayWorkout";
import {
  isAiwlTrainingDay,
  type TrainingDay,
} from "@/features/training/workoutGenerator/trainingDayWorkout";
import { resolveWorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Block, PicksBlock, Template } from "@/schemas/aiwl.schema";
import type { SwapWorkout, SwapWorkoutSource } from "./swapWorkout";

/** Lists each branch ID of the skill once, in session order, without placeholders. */
const listSessionBranchIds = (
  session: readonly UserExerciseDataType[],
  skill: string,
): string[] => {
  const branchIds = new Set<string>();
  for (const { branchId, skill: entrySkill } of session) {
    if (entrySkill !== skill) continue;
    if (!branchId || isPlaceholderBranch(branchId)) continue;
    branchIds.add(branchId);
  }
  return [...branchIds];
};

/**
 * Runs the workout setup with the short workout filters. The picks workout
 * keys its blocks by object identity, so the setup reads the template itself.
 */
export const setUpShortWorkout = (
  workout: SwapWorkout,
  template: Template,
): WorkoutInput =>
  setUpWorkout(
    workout.input,
    resolveWorkoutFilters(SHORT_WORKOUT_FILTERS),
    template,
    workout.skillTrees,
  );

const findPlanDayBlock = (day: TrainingDay, skill: string): Block | null => {
  const blocks = isAiwlTrainingDay(day)
    ? day.blocks
    : createStoredDayWorkout(day).blocks;
  return (
    blocks.find(
      (block) => block.kind === "branches" && block.skill === skill,
    ) ?? null
  );
};

// The session cannot tell which of two blocks of one skill drew a branch.
const findShortWorkoutBlock = (
  template: Template,
  skill: string,
): Block | null => {
  const blocks = template.blocks.filter((block) => block.skill === skill);
  if (blocks.length !== 1) return null;
  const [block] = blocks;
  return block.kind === "picks" || block.kind === "branches" ? block : null;
};

/** Finds the source block of the skill, or null when the skill offers no swap. */
export const findSkillBlock = (
  source: SwapWorkoutSource,
  skill: string,
): Block | null =>
  source.kind === "plan"
    ? findPlanDayBlock(source.day, skill)
    : findShortWorkoutBlock(source.template, skill);

const buildPicksBranchesBlock = (
  workout: SwapWorkout,
  template: Template,
  block: PicksBlock,
  branches: string[],
): BranchesBlock => {
  const { picksWorkout } = setUpShortWorkout(workout, template);
  const { sets, superset, rest, setDuration, values } =
    readResolvedPicksBlockTiming(picksWorkout, block);
  return {
    kind: "branches",
    skill: block.skill,
    sets,
    superset,
    rest,
    ...(setDuration !== undefined && { setDuration }),
    ...(values !== undefined && { values }),
    branches,
  };
};

/**
 * Builds the branches block that the swap generates for the skill. Timing and
 * minutes come from the source, branch IDs from the session. Null when the
 * source contains no picks or branches block for the skill.
 */
export const buildSkillBranchesBlock = (
  workout: SwapWorkout,
  skill: string,
): BranchesBlock | null => {
  const block = findSkillBlock(workout.source, skill);
  const branches = listSessionBranchIds(workout.session, skill);
  if (block?.kind === "branches") return { ...block, branches };
  if (block?.kind === "picks" && workout.source.kind === "short") {
    return buildPicksBranchesBlock(
      workout,
      workout.source.template,
      block,
      branches,
    );
  }
  return null;
};
