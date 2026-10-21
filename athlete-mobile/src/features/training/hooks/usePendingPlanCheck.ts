import { getAllExercises } from "@/data/exerciseRegistry";
import { isStoredPlanBroken } from "@/features/training/utils/storedPlanCheck";
import { getUserLevel } from "@/features/training/utils/workoutUtils";
import { useAuthStore } from "@/store/authStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useEffect, useState } from "react";
import { useUpdateTrainingPlan } from "./useUpdateTrainingPlan";

// Every store the check and the plan generation read
const PLAN_INPUT_STORES = [
  useAuthStore,
  useExerciseProgressStore,
  usePlacesStore,
  useTrainingScheduleStore,
  useUserProfileStore,
  useUserWorkoutStore,
];

const allInputsHydrated = () =>
  PLAN_INPUT_STORES.every((store) => store.persist.hasHydrated());

function usePlanInputsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(allInputsHydrated);
  useEffect(() => {
    const update = () => setHydrated(allInputsHydrated());
    const unsubscribes = PLAN_INPUT_STORES.map((store) =>
      store.persist.onFinishHydration(update),
    );
    update();
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);
  return hydrated;
}

/**
 * Checks a stored plan once after a store migration marked it, and rebuilds
 * it only when it is broken. Never blocks app start.
 */
export function usePendingPlanCheck() {
  const hydrated = usePlanInputsHydrated();
  const userId = useAuthStore((state) => state.auth?.userId);
  const { workoutData, trainingPlan, planCheckPending, setPlanCheckPending } =
    useUserWorkoutStore();
  const birthday = useUserProfileStore(
    (state) => state.personalData?.birthday ?? "",
  );
  const trainingDays = useTrainingScheduleStore((state) => state.trainingDays);
  const places = usePlacesStore((state) => state.places);
  const branchData = useExerciseProgressStore((state) => state.branchData);
  const { updateTrainingPlan } = useUpdateTrainingPlan();

  useEffect(() => {
    if (!hydrated || !planCheckPending || !userId) return;
    try {
      // Nested ifs instead of &&: the React Compiler skips a try block that
      // contains a logical expression.
      if (trainingPlan !== null) {
        const broken = isStoredPlanBroken({
          plan: trainingPlan,
          birthday,
          userLevel: getUserLevel({ userId, workoutData }),
          trainingDays,
          places,
          exercises: getAllExercises(),
          branchData,
        });
        if (broken) {
          updateTrainingPlan({ redrawAllDays: true });
        }
      }
    } catch (error) {
      // the athlete keeps the stored plan
      console.error("Stored plan check after update failed", error);
    }
    setPlanCheckPending(false);
  }, [
    hydrated,
    planCheckPending,
    userId,
    trainingPlan,
    workoutData,
    birthday,
    trainingDays,
    places,
    branchData,
    updateTrainingPlan,
    setPlanCheckPending,
  ]);
}
