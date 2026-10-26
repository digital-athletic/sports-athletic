import { featureFlags } from "@/config/featureFlags";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TrainingType } from "@/features/training/models/Training";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { createGenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import { generateShortWorkoutFromTemplate } from "@/features/training/workoutGenerator/shortWorkoutGeneration";
import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
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
  userExerciseData: {
    exerciseData: Record<string, UserExerciseDataType | undefined>;
    branchData: Record<string, UserExerciseBranchDataType | undefined>;
  };
}

const generateWithOldGenerator = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] =>
  new TrainingGenerator().generateTraining(
    request.type,
    request.user,
    request.place,
    request.exercises,
    request.skillTrees,
    request.weekday,
    request.equipment,
    request.givenSection,
    request.daysSinceLastWorkout,
    request.userExerciseData,
  );

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
 * Picks the generator per training type. Short workouts run on the AIWL
 * generator, the strength test on the old one, and plan training days on the
 * AIWL generator only while the flag is on.
 */
export const generateWorkout = (
  request: WorkoutGenerationRequest,
): GeneratedSetListEntry[] => {
  if (request.type === "TEST_WORKOUT") {
    return generateWithOldGenerator(request);
  }
  if (request.type !== "PLAN") {
    return generateShortWorkout(request);
  }
  if (!featureFlags.aiwlGeneratorEnabled) {
    return generateWithOldGenerator(request);
  }
  return generateTrainingDayFromStoredDay(
    selectStoredTrainingDay(
      request.user,
      request.weekday,
      request.givenSection,
      request.daysSinceLastWorkout,
    ),
    createInput(request),
  );
};
