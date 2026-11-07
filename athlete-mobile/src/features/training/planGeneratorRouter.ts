import { featureFlags } from "@/config/featureFlags";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { generateTrainingPlan } from "@/features/training/planGenerator/planGeneration";
import { buildPlanGenerationInput } from "@/features/training/planGenerator/planGenerationInput/planGenerationInputBuilder";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import type { PlacesData } from "@/store/placesStore";

/** The inputs plan creation and regeneration pass to the old plan generator. */
export interface PlanGenerationRequest {
  user: UserType;
  exercises: ExerciseType[];
  skillTrees: Record<string, SkillTreeType>;
  branchData: BranchDataMapType;
  trainingDays: TrainingDayType[];
  places: PlacesData;
  startDate: Date;
}

/**
 * Picks the plan generator by the plan generator flag. The old plan generator
 * reads the request; the new one reads the stores through the plan generation
 * input builder and takes only the start date from the request.
 */
export const generatePlan = (
  request: PlanGenerationRequest,
): TrainingPlanType => {
  if (featureFlags.planGeneratorEnabled) {
    return generateTrainingPlan(
      buildPlanGenerationInput({ planStartDate: request.startDate }),
    );
  }
  return PlanGenerator.generatePlan(
    request.user,
    request.exercises,
    request.skillTrees,
    request.branchData,
    request.trainingDays,
    request.places,
    request.startDate,
  );
};
