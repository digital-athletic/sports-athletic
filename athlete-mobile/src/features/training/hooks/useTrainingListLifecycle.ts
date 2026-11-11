import { Alert } from "@/common/Alert";
import { useTrainingScreenLifecycle } from "@/features/training/hooks/useTrainingScreenLifecycle";
import { isTrainingCategory } from "@/features/training/models/Training";
import { useTrainingStore } from "@/features/training/trainingStore";
import { hasSavedProgress } from "@/features/training/utils/checklistEntries";
import {
  resolveAbortExit,
  SELECTION_ROUTE_NAME,
} from "@/features/training/utils/resolveAbortExit";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import {
  useLocalSearchParams,
  useNavigation,
  usePreventRemove,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type UseTrainingListLifecycleParams = {
  isEnding: boolean;
};

type TrainingListExit = "DISCARD" | "ABORT";

type StackRoute = { name: string; params?: object };

type ExitContext = {
  router: ReturnType<typeof useRouter>;
  navigation: {
    getState: () => { routes: StackRoute[] } | undefined;
    getParent: () =>
      | { canGoBack: () => boolean; goBack: () => void }
      | undefined;
  };
  params: { weekday?: string; place?: string };
};

const selectionCategoryIn = (routes: StackRoute[]): unknown => {
  const params = routes.find(
    (route) => route.name === SELECTION_ROUTE_NAME,
  )?.params;
  return params && "category" in params ? params.category : undefined;
};

// POP_TO replaces the target's params, so each target gets its own back.
// The parent goBack pops the whole training route off the root stack.
function leaveTrainingList(
  exit: TrainingListExit,
  { router, navigation, params }: ExitContext,
) {
  if (exit === "DISCARD") {
    router.dismissTo({ pathname: "/training/training-overview", params });
    return;
  }
  const routes = navigation.getState()?.routes ?? [];
  const parent = navigation.getParent();
  const target = resolveAbortExit(
    routes.map((route) => route.name),
    parent?.canGoBack() ?? false,
  );
  const category = selectionCategoryIn(routes);
  if (target === "SELECTION" && isTrainingCategory(category)) {
    router.dismissTo({ pathname: "/training/new", params: { category } });
  } else if (target === "ORIGIN") {
    parent?.goBack();
  } else {
    router.replace("/(tabs)/(home)");
  }
}

/**
 * Screen-level lifecycle wiring for the list-view training flow: every way
 * back (header, Android hardware back, iOS swipe) discards the session and
 * returns to the overview, or aborts the training once a completed set saved
 * progression and returns to the screen that resolveAbortExit picks.
 * Back-button/keep-awake/focus wiring is shared with the sequential flow via
 * useTrainingScreenLifecycle.
 * Reachability of this screen behind the feature flag is enforced by
 * Stack.Protected in app/training/_layout.tsx, not here.
 */
export function useTrainingListLifecycle({
  isEnding,
}: UseTrainingListLifecycleParams) {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ weekday?: string; place?: string }>();
  const [exit, setExit] = useState<TrainingListExit | null>(null);
  // Read through a ref so a re-render with new objects does not dispatch again.
  const latestRef = useRef<ExitContext>({ router, navigation, params });
  useEffect(() => {
    latestRef.current = { router, navigation, params };
  });

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
  useEffect(() => {
    if (exit !== null) leaveTrainingList(exit, latestRef.current);
  }, [exit]);

  usePreventRemove(exit === null && !isEnding, handleDiscard);

  const { isScreenFocused } = useTrainingScreenLifecycle({
    onAbort: handleDiscard,
  });

  return { handleDiscard, isScreenFocused };
}
