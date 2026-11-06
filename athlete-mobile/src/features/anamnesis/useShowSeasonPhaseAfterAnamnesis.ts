import { isPlanEnded } from "@/features/training/utils/timeUtils";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";

export const useShowSeasonPhaseAfterAnamnesis = () => {
  const { trainingDays } = useTrainingScheduleStore();
  const { workoutData, trainingPlan } = useUserWorkoutStore();

  let hasActiveTrainingDay = false;
  for (let day = 0; day < trainingDays.length; day++) {
    if (trainingDays[day].active) {
      hasActiveTrainingDay = true;
      break;
    }
  }

  return !(
    hasActiveTrainingDay &&
    workoutData?.seasonPhase?.endDate &&
    workoutData?.seasonPhase?.type &&
    !isPlanEnded(trainingPlan, new Date())
  );
};
