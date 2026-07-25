import { useTrainingStore } from "@/features/training/trainingStore";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { useKeepAwake } from "expo-keep-awake";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";

interface UseTrainingScreenLifecycleParams {
  onAbort: () => void;
}

/**
 * Screen-level lifecycle wiring for the active training screen: keeps the
 * device awake, blocks the hardware back button (routing it through
 * `onAbort`), tracks screen focus, and logs the `training_started` event.
 */
export function useTrainingScreenLifecycle({
  onAbort,
}: UseTrainingScreenLifecycleParams) {
  useKeepAwake();
  const activeTraining = useTrainingStore((state) => state.activeTraining);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // Handle back button to prevent accidental exit
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          onAbort();
          return true;
        },
      );

      return () => subscription.remove();
    }, [onAbort]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  // Log training started
  useEffect(() => {
    logTrainingEvent(activeTraining, "training_started");
  }, [activeTraining]);

  return { isScreenFocused };
}
