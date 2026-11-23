import { loadStrengthTestTemplate } from "@/data/loadStrengthTestTemplate";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { readTrainingDayWorkout } from "@/features/training/workoutGenerator/trainingDayWorkout";
import type { WorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import {
  generateSetListFromWorkout,
  type SelectedWorkout,
} from "@/features/training/workoutGenerator/workoutGeneration";
import {
  readReplacementPools,
  type DrawnBlock,
} from "@/features/training/workoutGenerator/replacementPools";
import type { FinishedWorkout } from "@/features/training/workoutGenerator/stages/workoutFinish";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserExerciseDataMapType } from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { selectStoredTrainingDay } from "./storedTrainingDaySelection";

export interface WorkoutGenerationRequest {
  type: TrainingType;
  user: UserType;
  place: string;
  exercises: ExerciseType[];
  skillTrees: Record<string, SkillTreeType>;
  weekday: number;
  equipment: string[];
  givenSection: number | undefined;
  daysSinceLastWorkout: number;
  userExerciseData: UserExerciseDataMapType;
}

const createInput = (request: WorkoutGenerationRequest, random: () => number) =>
  createGenerationInput({
    athlete: request.user,
    place: request.place,
    equipment: request.equipment,
    exerciseCatalog: request.exercises,
    exerciseData: request.userExerciseData,
    random,
  });

/** Short and custom workouts ignore muscle soreness, as Pain, Soreness, and Prevention defines. */
export const SHORT_WORKOUT_FILTERS: Partial<WorkoutFilters> = Object.freeze({
  soreness: false,
});

/** The athlete picks no place for the strength test, and its lifts ignore pain. */
export const STRENGTH_TEST_FILTERS: Partial<WorkoutFilters> = Object.freeze({
  pain: false,
  equipment: false,
});

const selectShortWorkout = (type: TrainingType): SelectedWorkout => {
  const template = lookupTemplate(type);
  if (!template) {
    throw {
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: [type],
    } satisfies GeneratorError;
  }
  // A template without blocks counts as an empty pool, so it throws the pain
  // error whatever the athlete's pains.
  if (template.blocks.length === 0) {
    throw {
      type: "NO_EXERCISES",
      subtype: "PAIN",
      params: [],
    } satisfies GeneratorError;
  }
  return { workout: template, lookUpBranch: lookUpStoredBranchInCatalog };
};

/** The request fields that select a workout. */
type WorkoutSelectionRequest = Pick<
  WorkoutGenerationRequest,
  "type" | "user" | "weekday" | "givenSection" | "daysSinceLastWorkout"
>;

/** The selected workout, its branch lookup and the filters its type sets. */
export interface WorkoutSelection extends SelectedWorkout {
  filters: Partial<WorkoutFilters>;
}

/**
 * Selects the workout, the branch lookup and the filters per training type: a
 * plan training day with every filter on, the strength test, or a short
 * workout from its template.
 *
 * selectWorkout({ type: "TEST_WORKOUT", ... })
 * → { workout: <strength test template>, lookUpBranch, filters: STRENGTH_TEST_FILTERS }
 */
export const selectWorkout = (
  request: WorkoutSelectionRequest,
): WorkoutSelection => {
  if (request.type === "PLAN") {
    const day = selectStoredTrainingDay(
      request.user,
      request.weekday,
      request.givenSection,
      request.daysSinceLastWorkout,
    );
    return { ...readTrainingDayWorkout(day), filters: {} };
  }
  if (request.type === "TEST_WORKOUT") {
    return {
      workout: loadStrengthTestTemplate(),
      lookUpBranch: lookUpStoredBranchInCatalog,
      filters: STRENGTH_TEST_FILTERS,
    };
  }
  return {
    ...selectShortWorkout(request.type),
    filters: SHORT_WORKOUT_FILTERS,
  };
};

export interface SetListOptions {
  /** Every draw reads it; the app passes Math.random. */
  random: () => number;
  /**
   * previousDrawnBlocks replays a drawn workout: its branches blocks run instead of the
   * template's draws. The template is still needed because a blocked branch is
   * replaced from the pool of the template block it was drawn from
   * (DrawnBlock.templateIndex), and a branches block does not know that pool.
   */
  previousDrawnBlocks?: readonly DrawnBlock[];
}

/**
 * Generates the set list of a training start: the public entry point the app
 * calls after `selectWorkout`. Turns the request into the generator input and
 * calls `generateSetListFromWorkout` once.
 *
 * 1. Builds the generator input from the request (athlete, place, equipment,
 *    exercise catalog, progress) and the given random source.
 * 2. Without `previousDrawnBlocks`, generates from the selected template.
 * 3. With `previousDrawnBlocks` (a drawn workout), generates from the drawn
 *    branches instead of the template's picks. A branch the athlete can no
 *    longer train (new pain, missing equipment) is replaced in its own slot
 *    only, from the pool of the template block it was drawn from.
 *
 * Returns the set list and the result of each block. Throws the generator
 * errors of `generateSetListFromWorkout`, and throws when a drawn block names a
 * template index that matches no picks block of the template.
 *
 * generateSetList(selectWorkout(request), request, { random: Math.random })
 * → { setList: [{ branchId: "410", skill: "WU", ... }], blocks: [...] }
 */
export const generateSetList = (
  selection: WorkoutSelection,
  request: WorkoutGenerationRequest,
  { random, previousDrawnBlocks }: SetListOptions,
): FinishedWorkout<GeneratedSetListEntry> => {
  const { workout, lookUpBranch, filters } = selection;
  const input = createInput(request, random);
  const options = { skillTrees: request.skillTrees, filters };
  if (previousDrawnBlocks === undefined) {
    return generateSetListFromWorkout(workout, lookUpBranch, input, options);
  }
  const replay = {
    id: workout.id,
    blocks: previousDrawnBlocks.map(({ block }) => block),
  };
  const replacementPools = readReplacementPools(
    workout,
    previousDrawnBlocks,
    input,
    request.skillTrees,
  );
  return generateSetListFromWorkout(replay, lookUpBranch, input, {
    ...options,
    branchRefill: "blockedSlots",
    replacementPools,
  });
};
