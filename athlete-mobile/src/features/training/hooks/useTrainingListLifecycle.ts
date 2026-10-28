import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type UseTrainingListLifecycleParams = {
  onFinish: (aborted: boolean) => void;
};

/**
 * Screen-level lifecycle wiring for the list-view training flow: builds the
 * abort confirmation and delegates back-button/keep-awake/focus wiring to
 * useTrainingScreenLifecycle (shared with the sequential flow). Reachability
 * of this screen behind the feature flag is enforced by Stack.Protected in
 * app/training/_layout.tsx, not here.
 */
export function useTrainingListLifecycle({
  onFinish,
}: UseTrainingListLifecycleParams) {
  const { t } = useTranslation();

  const handleAbort = useCallback(() => {
    Alert.alert(
      t("training.active.abort.question"),
      t("training.active.abort.explanation"),
      [
        { text: t("common.yes"), onPress: () => onFinish(true) },
        { text: t("common.no") },
      ],
    );
  }, [onFinish, t]);

  const { isScreenFocused } = useTrainingScreenLifecycle({
    onAbort: handleAbort,
  });

  return { handleAbort, isScreenFocused };
}
