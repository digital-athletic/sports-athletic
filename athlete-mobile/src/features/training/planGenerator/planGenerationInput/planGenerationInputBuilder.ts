import {
  loadPlanAuthoredData,
  type PlanAuthoredData,
} from "@/data/loadPlanAuthoredData";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { formatDateToISO } from "@/utils/date";
import type { PlanGenerationInput } from "./planGenerationInput";

export interface PlanGenerationInputOptions {
  planStartDate: Date;
  random?: () => number;
  authoredData?: PlanAuthoredData;
}

/**
 * Builds the plan generation input: reads every store and the authored data
 * once, and the clock once for the reference date. Tests pass a fixed random
 * source; the app draws through Math.random.
 */
export const buildPlanGenerationInput = ({
  planStartDate,
  // every draw reads Math.random when it runs, so tests can replace it
  random = () => Math.random(),
  authoredData = loadPlanAuthoredData(),
}: PlanGenerationInputOptions): PlanGenerationInput => {
  const { personalData } = useUserProfileStore.getState();
  const { workoutData } = useUserWorkoutStore.getState();
  const { trainingDays } = useTrainingScheduleStore.getState();
  return Object.freeze({
    athlete: Object.freeze({ personalData, workoutData }),
    seasonPhase: workoutData.seasonPhase,
    weeklySchedule: Object.freeze([...trainingDays]),
    trainingPlaces: usePlacesStore.getState().places,
    authoredData,
    exerciseData: useExerciseProgressStore.getState().branchData,
    planStartDate: formatDateToISO(planStartDate),
    referenceDate: formatDateToISO(new Date()),
    random,
  });
};
