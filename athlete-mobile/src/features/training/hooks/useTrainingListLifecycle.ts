import { Alert } from "@/common/Alert";
import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { useTrainingStore } from "@/features/training/trainingStore";
import { hasSavedProgress } from "@/features/training/utils/checklistEntries";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { useLocalSearchParams, usePreventRemove, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type UseTrainingListLifecycleParams = {
  isEnding: boolean;
};

type TrainingListExit = "DISCARD" | "ABORT";

/**
 * Screen-level lifecycle wiring for the list-view training flow: every way
 * back (header, Android hardware back, iOS swipe) discards the session and
 * returns to the overview, or aborts the training once a completed set saved
 * progression and returns to the training selection. Back-button/keep-awake/focus
 * wiring is shared with the sequential flow via useTrainingScreenLifecycle.
 * Reachability of this screen behind the feature flag is enforced by
 * Stack.Protected in app/training/_layout.tsx, not here.
 */
export function useTrainingListLifecycle({
  isEnding,
}: UseTrainingListLifecycleParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ weekday?: string; place?: string }>();
  const [exit, setExit] = useState<TrainingListExit | null>(null);

  const handleDiscard = useCallback(() => {
    const { exerciseList } = useTrainingStore.getState();
    const isAbort = hasSavedProgress(exerciseList ?? []);
    const alertKey = isAbort
      ? "training.active.abort"
      : "training.list.discard";

    Alert.alert(t(`${alertKey}.question`), t(`${alertKey}.explanation`), [
      {
        text: t("common.yes"),
        onPress: () => {
          const { activeTraining, clearTraining, discardTrainingSession } =
            useTrainingStore.getState();
          logTrainingEvent(activeTraining, "training_discarded");
          if (isAbort) {
            clearTraining();
            setExit("ABORT");
          } else {
            discardTrainingSession();
            setExit("DISCARD");
          }
        },
      },
      { text: t("common.no") },
    ]);
  }, [t]);

  // Leaving the screen has to wait for the render that lifts the prevention.
  // POP_TO replaces the overview's params, so the overview gets its own back.
  // A resumed session has no screen below the list, so dismissTo replaces it.
  useEffect(() => {
    if (exit === "DISCARD") {
      router.dismissTo({ pathname: "/training/training-overview", params });
    } else if (exit === "ABORT") {
      router.dismissTo("/training");
    }
  }, [exit, router, params]);

  usePreventRemove(exit === null && !isEnding, handleDiscard);

  const { isScreenFocused } = useTrainingScreenLifecycle({
    onAbort: handleDiscard,
  });

  return { handleDiscard, isScreenFocused };
}
