import { featureFlags } from "@/config/featureFlags";
import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type UseTrainingListLifecycleParams = {
  onFinish: (aborted: boolean) => void;
};

/**
 * Screen-level lifecycle wiring for the list-view training flow: redirects
 * away if the feature flag is off, builds the abort confirmation, and
 * delegates back-button/keep-awake/focus wiring to useTrainingScreenLifecycle
 * (shared with the sequential flow).
 */
export function useTrainingListLifecycle({
  onFinish,
}: UseTrainingListLifecycleParams) {
  const { t } = useTranslation();
  const router = useRouter();

  // Deep-link/flag-flip guard: this screen only exists behind the flag.
  useEffect(() => {
    if (!featureFlags.trainingListViewEnabled) {
      router.replace("/training/training-overview");
    }
  }, [router]);

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

  useTrainingScreenLifecycle({ onAbort: handleAbort });

  return { handleAbort };
}
