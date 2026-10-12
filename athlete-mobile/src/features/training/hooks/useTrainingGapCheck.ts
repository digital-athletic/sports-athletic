import { Alert } from "@/common/Alert";
import {
  daysSinceLastTraining,
  getTrainingGapAction,
  shiftPlanForTrainingGap,
} from "@/features/training/utils/trainingGapUtils";
import { Logger } from "@/services/Logger";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Applies the training gap rule once per screen visit: after 8 to 21 days the
 * plan sections move forward and are saved; after more than 21 days the
 * athlete chooses between a new plan and the existing one, which then moves forward.
 */
export function useTrainingGapCheck(enabled: boolean): void {
  const { t } = useTranslation();
  const trainingPlan = useUserWorkoutStore((s) => s.trainingPlan);
  const setTrainingPlan = useUserWorkoutStore((s) => s.setTrainingPlan);
  const workoutsList = useCompletedWorkoutsStore((s) => s.workoutsList);
  const checked = useRef(false);

  useEffect(() => {
    if (!enabled || !trainingPlan || checked.current) return;
    checked.current = true;

    const today = new Date();
    const days = daysSinceLastTraining(
      workoutsList.map((workout) => workout.timestamp),
      trainingPlan,
      today,
    );

    switch (getTrainingGapAction(days)) {
      case "SHIFT":
        Logger.logEvent("training_plan_shifted_for_gap", { days });
        setTrainingPlan(shiftPlanForTrainingGap(trainingPlan, days, today));
        break;
      case "PROMPT_NEW_PLAN":
        Alert.alert(
          t("training.selectTraining.trainingGap.title"),
          t("training.selectTraining.trainingGap.message"),
          [
            {
              text: t("common.no"),
              style: "cancel",
              onPress: () => {
                Logger.logEvent("training_plan_shifted_for_gap", { days });
                setTrainingPlan(
                  shiftPlanForTrainingGap(trainingPlan, days, today),
                );
              },
            },
            {
              text: t("common.yes"),
              onPress: () => router.push("/(more)/anamnesis/season-phase"),
            },
          ],
        );
        break;
      case "NONE":
        break;
    }
  }, [enabled, trainingPlan, workoutsList, setTrainingPlan, t]);
}
