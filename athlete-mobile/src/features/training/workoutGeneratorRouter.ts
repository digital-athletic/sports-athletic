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
  generateFinishedWorkout,
  type SelectedWorkout,
} from "@/features/training/workoutGenerator/workoutGeneration";
import {
  readReplacementPools,
  type SavedBlock,
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

const createInput = (request: WorkoutGenerationRequest) =>
  createGenerationInput({
    athlete: request.user,
    place: request.place,
    equipment: request.equipment,
    exerciseCatalog: request.exercises,
    exerciseData: request.userExerciseData,
    // every draw reads Math.random when it runs
    random: () => Math.random(),
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

/**
 * Runs the selected workout and returns the finished workout. Only saved
 * versions of custom workouts pass `saved`: the saved blocks then run as
 * branches blocks, and a blocked branch is refilled in its own slot from the
 * pool of the template block it was drawn from.
 *
 * generateWorkout(selectWorkout(request), request, [{ block: wuBlock, templateIndex: 0 }])
 * → { setList: [{ branchId: "410", skill: "WU", ... }], blocks: [...] }
 */
export const generateWorkout = (
  selection: WorkoutSelection,
  request: WorkoutGenerationRequest,
  saved?: readonly SavedBlock[],
): FinishedWorkout<GeneratedSetListEntry> => {
  const { workout, lookUpBranch, filters } = selection;
  const input = createInput(request);
  const options = { skillTrees: request.skillTrees, filters };
  if (saved === undefined) {
    return generateFinishedWorkout(workout, lookUpBranch, input, options);
  }
  const replay = { id: workout.id, blocks: saved.map(({ block }) => block) };
  const replacementPools = readReplacementPools(
    workout,
    saved,
    input,
    request.skillTrees,
  );
  return generateFinishedWorkout(replay, lookUpBranch, input, {
    ...options,
    branchRefill: "blockedSlots",
    replacementPools,
  });
};
