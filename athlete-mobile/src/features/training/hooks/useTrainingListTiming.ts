import { useTrainingStore } from "@/features/training/trainingStore";
import { mapSkillCodeToFocusArea } from "@/features/training/utils/skillTreeUtils";
import { type SkillCode } from "@/schemas/generator.schema";
import { useRef, useState } from "react";

type OpenExercise = {
  skill: SkillCode | undefined;
  runMs: number;
  runningSince: number | null;
};

const runTimeOf = (exercise: OpenExercise) =>
  exercise.runMs +
  (exercise.runningSince === null ? 0 : Date.now() - exercise.runningSince);

/**
 * Time bookkeeping for the checklist. Time with a set's timer running counts
 * toward that exercise's focus area, however the sheet closes. Time on the
 * list itself counts as pause; a paused set timer counts nowhere.
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
    openExerciseRef.current = { skill, runMs: 0, runningSince: Date.now() };
  };

  const pauseExercise = () => {
    const exercise = openExerciseRef.current;
    if (!exercise || exercise.runningSince === null) return;
    openExerciseRef.current = {
      ...exercise,
      runMs: runTimeOf(exercise),
      runningSince: null,
    };
  };

  const resumeExercise = () => {
    const exercise = openExerciseRef.current;
    if (!exercise || exercise.runningSince !== null) return;
    openExerciseRef.current = { ...exercise, runningSince: Date.now() };
  };

  // The native sheet can report a dismiss after the sheet was already closed.
  const endExercise = () => {
    const exercise = openExerciseRef.current;
    if (!exercise) return;
    openExerciseRef.current = null;

    const focusArea = exercise.skill
      ? mapSkillCodeToFocusArea(exercise.skill)
      : undefined;
    if (focusArea) addSkillTime(focusArea, runTimeOf(exercise));
    pauseStartRef.current = Date.now();
  };

  return {
    startExercise,
    pauseExercise,
    resumeExercise,
    endExercise,
    endPause,
  };
}

export type TrainingListTiming = ReturnType<typeof useTrainingListTiming>;
