import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateShortWorkoutFromTemplate } from "@/features/training/workoutGenerator/shortWorkoutGeneration";
import { generateStrengthTest } from "@/features/training/workoutGenerator/strengthTestGeneration";
import { generateTrainingDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
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

const generateShortWorkout = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] => {
  const template = lookupTemplate(request.type);
  if (!template) {
    throw {
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: [request.type],
    } satisfies GeneratorError;
  }
  return generateShortWorkoutFromTemplate(
    template,
    createInput(request),
    request.skillTrees,
  );
};

/**
 * Picks the AIWL entry point per training type: the strength test, a plan
 * training day, or a short workout from its template.
 */
export const generateWorkout = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] => {
  if (request.type !== "PLAN" && request.type !== "TEST_WORKOUT") {
    return generateShortWorkout(request);
  }
  if (request.type === "TEST_WORKOUT") {
    return generateStrengthTest(createInput(request), request.skillTrees);
  }
  return generateTrainingDay(
    selectStoredTrainingDay(
      request.user,
      request.weekday,
      request.givenSection,
      request.daysSinceLastWorkout,
    ),
    createInput(request),
  );
};
