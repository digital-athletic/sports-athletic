import { useTrainingStore } from "@/features/training/trainingStore";
import { mapSkillCodeToFocusArea } from "@/features/training/utils/skillTreeUtils";
import { type SkillCode } from "@/schemas/generator.schema";
import { useRef, useState } from "react";

type OpenExercise = { startedAt: number; skill: SkillCode | undefined };

/**
 * Time bookkeeping for the checklist. Time with an exercise sheet open counts
 * toward that exercise's focus area, however the sheet closes. Time on the
 * list itself counts as pause.
 */
export function useTrainingListTiming() {
  const addPauseTime = useTrainingStore((s) => s.addPauseTime);
  const addSkillTime = useTrainingStore((s) => s.addSkillTime);
  const [mountTime] = useState(() => Date.now());
  const pauseStartRef = useRef<number | null>(mountTime);
  const openExerciseRef = useRef<OpenExercise | null>(null);

  const endPause = () => {
    if (pauseStartRef.current === null) return;
    addPauseTime(Date.now() - pauseStartRef.current);
    pauseStartRef.current = null;
  };

  const startExercise = (skill: SkillCode | undefined) => {
    endPause();
    openExerciseRef.current = { startedAt: Date.now(), skill };
  };

  // The native sheet can report a dismiss after the sheet was already closed.
  const endExercise = () => {
    const exercise = openExerciseRef.current;
    if (!exercise) return;
    openExerciseRef.current = null;

    const focusArea = exercise.skill
      ? mapSkillCodeToFocusArea(exercise.skill)
      : undefined;
    if (focusArea) addSkillTime(focusArea, Date.now() - exercise.startedAt);
    pauseStartRef.current = Date.now();
  };

  return { startExercise, endExercise, endPause };
}

export type TrainingListTiming = ReturnType<typeof useTrainingListTiming>;
