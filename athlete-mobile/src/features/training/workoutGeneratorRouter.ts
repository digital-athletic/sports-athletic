import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateStrengthTest } from "@/features/training/workoutGenerator/strengthTestGeneration";
import { generateTrainingDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
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
 * Picks the AIWL entry point per training type: the strength test, a plan
 * training day, or a short workout from its template through the one entry
 * point.
 */
export const generateWorkout = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] => {
  if (request.type === "TEST_WORKOUT") {
    return generateStrengthTest(createInput(request), request.skillTrees);
  }
  if (request.type === "PLAN") {
    return generateTrainingDay(
      selectStoredTrainingDay(
        request.user,
        request.weekday,
        request.givenSection,
        request.daysSinceLastWorkout,
      ),
      createInput(request),
    );
  }
  const { workout, lookUpBranch } = selectShortWorkout(request.type);
  return generateSetList(workout, lookUpBranch, createInput(request), {
    skillTrees: request.skillTrees,
  });
};
