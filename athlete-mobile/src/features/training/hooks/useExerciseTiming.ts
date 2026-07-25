import { useTrainingStore } from "@/features/training/trainingStore";
import { useCallback, useEffect, useRef } from "react";

/**
 * Owns the exercise-start and pause-start timestamps behind the pause/skill
 * time accounting. The exercise timer resets automatically whenever a
 * training (re)starts.
 */
export function useExerciseTiming() {
  const activeTraining = useTrainingStore((state) => state.activeTraining);
  const exerciseStartTimeRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number>(Date.now());

  const markPauseStart = useCallback(() => {
    pauseStartRef.current = Date.now();
  }, []);

  const handlePauseToggled = useCallback(
    (wasPaused: boolean) => {
      if (wasPaused) {
        // Resume: add pause duration to tracking
        const pauseDuration = Date.now() - pauseStartRef.current;
        exerciseStartTimeRef.current += pauseDuration;
      } else {
        markPauseStart();
      }
    },
    [markPauseStart],
  );

  const getPauseElapsed = useCallback(
    () => Date.now() - pauseStartRef.current,
    [],
  );

  const getExerciseElapsed = useCallback(
    () => Date.now() - exerciseStartTimeRef.current,
    [],
  );

  const resetExerciseStart = useCallback(() => {
    exerciseStartTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    resetExerciseStart();
  }, [activeTraining, resetExerciseStart]);

  return {
    handlePauseToggled,
    getPauseElapsed,
    getExerciseElapsed,
    markPauseStart,
    resetExerciseStart,
  };
}
