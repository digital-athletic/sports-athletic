import { Alert } from "@/common/Alert";
import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { useTrainingStore } from "@/features/training/trainingStore";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { usePreventRemove, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type UseTrainingListLifecycleParams = {
  isEnding: boolean;
};

/**
 * Screen-level lifecycle wiring for the list-view training flow: every way
 * back (header, Android hardware back, iOS swipe) asks to discard the session
 * and returns to the overview. Back-button/keep-awake/focus wiring is shared
 * with the sequential flow via useTrainingScreenLifecycle. Reachability of
 * this screen behind the feature flag is enforced by Stack.Protected in
 * app/training/_layout.tsx, not here.
 */
export function useTrainingListLifecycle({
  isEnding,
}: UseTrainingListLifecycleParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDiscarded, setIsDiscarded] = useState(false);

  const handleDiscard = useCallback(() => {
    Alert.alert(
      t("training.list.discard.question"),
      t("training.list.discard.explanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => {
            const { activeTraining, discardTrainingSession } =
              useTrainingStore.getState();
            logTrainingEvent(activeTraining, "training_discarded");
            discardTrainingSession();
            setIsDiscarded(true);
          },
        },
        { text: t("common.no") },
      ],
    );
  }, [t]);

  // Leaving the screen has to wait for the render that lifts the prevention.
  useEffect(() => {
    if (isDiscarded) router.dismissTo("/training/training-overview");
  }, [isDiscarded, router]);

  usePreventRemove(!isDiscarded && !isEnding, handleDiscard);

  const { isScreenFocused } = useTrainingScreenLifecycle({
    onAbort: handleDiscard,
  });

  return { handleDiscard, isScreenFocused };
}
