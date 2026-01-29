import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useCallback } from "react";

/**
 * Hook to regenerate the training plan while preserving the original start date.
 * Used when equipment or training settings change and the plan needs to be updated.
 */
export function useUpdateTrainingPlan() {
  const { branchData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { userId } = useUserProfileStore();
  const { workoutData, trainingPlan, setTrainingPlan } = useUserWorkoutStore();

  const updateTrainingPlan = useCallback(() => {
    if (!trainingPlan || !userId) {
      return;
    }

    const oldStartDate = trainingPlan.start;

    const user = {
      userId,
      workoutData,
    };

    const exercises = getAllExercises();
    const skillTrees = getAllSkillTrees();

    const plan = PlanGenerator.generatePlan(
      user,
      exercises,
      skillTrees,
      branchData,
      trainingDays,
      places,
      new Date(oldStartDate),
    );

    setTrainingPlan(plan);
  }, [
    branchData,
    trainingDays,
    places,
    userId,
    workoutData,
    trainingPlan,
    setTrainingPlan,
  ]);

  return { updateTrainingPlan };
}
