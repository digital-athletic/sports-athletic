import { loadStrengthTestTemplate } from "@/data/loadStrengthTestTemplate";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateTrainingDaySetList } from "@/features/training/workoutGenerator/trainingDayWorkout";
import type { WorkoutFilters } from "@/features/training/workoutGenerator/workoutFilters";
import {
  generateSetList,
  type SelectedWorkout,
} from "@/features/training/workoutGenerator/workoutGeneration";
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
const SHORT_WORKOUT_FILTERS: Partial<WorkoutFilters> = Object.freeze({
  soreness: false,
});

/** The athlete picks no place for the strength test, and its lifts ignore pain. */
export const STRENGTH_TEST_FILTERS: Partial<WorkoutFilters> = Object.freeze({
  pain: false,
  equipment: false,
});

// A template without blocks counts as an empty pool, so it throws the pain
// error whatever the athlete's pains.
const selectShortWorkout = (type: TrainingType): SelectedWorkout => {
  const template = lookupTemplate(type);
  if (!template) {
    throw {
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: [type],
    } satisfies GeneratorError;
  }
  if (template.blocks.length === 0) {
    throw {
      type: "NO_EXERCISES",
      subtype: "PAIN",
      params: [],
    } satisfies GeneratorError;
  }
  return { workout: template, lookUpBranch: lookUpStoredBranchInCatalog };
};

/**
 * Selects the workout, the branch lookup and the filters per training type,
 * then generates its set list through the one entry point: a plan training
 * day with every filter on, the strength test, or a short workout from its
 * template.
 */
export const generateWorkout = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] => {
  const input = createInput(request);
  if (request.type === "PLAN") {
    return generateTrainingDaySetList(
      selectStoredTrainingDay(
        request.user,
        request.weekday,
        request.givenSection,
        request.daysSinceLastWorkout,
      ),
      input,
      request.skillTrees,
    );
  }
  if (request.type === "TEST_WORKOUT") {
    return generateSetList(
      loadStrengthTestTemplate(),
      lookUpStoredBranchInCatalog,
      input,
      { skillTrees: request.skillTrees, filters: STRENGTH_TEST_FILTERS },
    );
  }
  const { workout, lookUpBranch } = selectShortWorkout(request.type);
  return generateSetList(workout, lookUpBranch, input, {
    skillTrees: request.skillTrees,
    filters: SHORT_WORKOUT_FILTERS,
  });
};
