import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generatePlan } from "@/features/training/planGeneratorRouter";
import { keepUnchangedTrainingDays } from "@/features/training/utils/planRegeneration";
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
 * Used when equipment or training settings change; unaffected training days keep their branches.
 */
export function useUpdateTrainingPlan() {
  const { branchData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { auth } = useAuthStore();
  const userId = auth?.userId;
  const { personalData } = useUserProfileStore();
  const { workoutData, trainingPlan, setTrainingPlan } = useUserWorkoutStore();

  // Returns whether a plan was regenerated; a repair of a broken plan redraws every day
  const updateTrainingPlan = useCallback(
    ({ redrawAllDays = false } = {}): boolean => {
      if (!trainingPlan || !userId) {
        return false;
      }

      // older plans store the start with a time
      const oldStartDate = trainingPlan.start.split("T")[0];

      const user = {
        userId,
        personalData,
        workoutData,
      };

      const exercises = getAllExercises();
      const skillTrees = getAllSkillTrees();

      const plan = generatePlan({
        user,
        exercises,
        skillTrees,
        branchData,
        trainingDays,
        // callers save equipment right before, so read it fresh, not from the render
        places: usePlacesStore.getState().places,
        startDate: ISODateToDate(oldStartDate),
      });

      setTrainingPlan(
        redrawAllDays ? plan : keepUnchangedTrainingDays(trainingPlan, plan),
      );
      return true;
    },
    [
      branchData,
      trainingDays,
      userId,
      personalData,
      workoutData,
      trainingPlan,
      setTrainingPlan,
    ],
  );

  return { updateTrainingPlan };
}
