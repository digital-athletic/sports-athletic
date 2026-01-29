import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import { useAuthStore } from "@/store/authStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { ISODateToDate } from "@/utils/date";
import { useCallback } from "react";

/**
 * Hook to regenerate the training plan while preserving the original start date.
 * Used when equipment or training settings change and the plan needs to be updated.
 */
export function useUpdateTrainingPlan() {
  const { branchData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { auth } = useAuthStore();
  const userId = auth?.userId;
  const { personalData } = useUserProfileStore();
  const { workoutData, trainingPlan, setTrainingPlan } = useUserWorkoutStore();

  const updateTrainingPlan = useCallback(() => {
    if (!trainingPlan || !userId) {
      return;
    }

    const oldStartDate = trainingPlan.start;

    const user = {
      userId,
      personalData,
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
      ISODateToDate(oldStartDate),
    );

    setTrainingPlan(plan);
  }, [
    branchData,
    trainingDays,
    places,
    userId,
    personalData,
    workoutData,
    trainingPlan,
    setTrainingPlan,
  ]);

  return { updateTrainingPlan };
}
