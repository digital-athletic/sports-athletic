import { featureFlags } from "@/config/featureFlags";
import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getTrainingRouteForMode } from "@/features/training/utils/resumeUtils";
import { useRouter } from "expo-router";
import { useEffect } from "react";

type UseTrainingActiveLifecycleParams = {
  onAbort: () => void;
};

/**
 * Screen-level lifecycle wiring for the sequential training flow: redirects
 * to the checklist screen if the persisted session is actually list-mode
 * (deep link, or a mode/flag mismatch) — otherwise it would proceed
 * sequentially and re-record time for already-completed exercises.
 * Delegates back-button/keep-awake/focus wiring to
 * useTrainingScreenLifecycle (shared with the list-view flow).
 */
export function useTrainingActiveLifecycle({
  onAbort,
}: UseTrainingActiveLifecycleParams) {
  const router = useRouter();
  const trainingViewMode = useTrainingStore((s) => s.trainingViewMode);

  useEffect(() => {
    const route = getTrainingRouteForMode(
      trainingViewMode,
      featureFlags.trainingListViewEnabled,
    );
    if (route !== "/training/training-active") {
      router.replace(route);
    }
  }, [trainingViewMode, router]);

  return useTrainingScreenLifecycle({ onAbort });
}
