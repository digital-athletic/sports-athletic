import { useChecklistRest } from "@/features/training/hooks/useChecklistRest";
import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListSetNavigation } from "@/features/training/hooks/useTrainingListSetNavigation";
import { type TrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  findNextSetRow,
  findRestAfter,
  type SheetRestControl,
} from "@/features/training/utils/checklistRest";
import { isEnduranceSkill } from "@/features/training/utils/exerciseDataUtils";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";

type Args = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  repsDraft: Record<number, number>;
  timing: Pick<TrainingListTiming, "startExercise" | "endExercise">;
  onChangeReps: (index: number, value: string) => void;
  onSubmitReps: (row: ListRow) => void;
  onComplete: (row: ListRow, feedback?: DifficultyFeedbackType) => void;
  onRestEnd: (restIndex: number, skipped: boolean) => void;
  onSkip: (row: ListRow) => void;
};

// The athlete tracks long endurance exercises elsewhere, so they get no countdown.
const countdownDurationOf = (exercise: UserExerciseDataType | undefined) =>
  isEnduranceSkill(exercise?.skill) ? undefined : exercise?.duration;

// The one place that decides whether a rest follows the row's set.
const buildRestControl = (
  row: ListRow,
  rows: ListRow[],
  exerciseList: UserExerciseDataType[] | null,
  tracker: ReturnType<typeof useChecklistRest>,
): SheetRestControl | undefined => {
  const rest = findRestAfter(exerciseList, row.index);
  if (!rest) return undefined;

  const nextRow = findNextSetRow(rows, row.index);
  return {
    plan: {
      duration: rest.duration,
      nextSet: nextRow
        ? {
            exerciseId: nextRow.exerciseId,
            displayName: nextRow.displayName,
            label: nextRow.nextSetLabel,
          }
        : undefined,
    },
    onStart: () => tracker.startRest(rest.index),
    onEnd: tracker.endRest,
  };
};

/**
 * Builds TrainingExerciseSheet's props from the set the sheet shows, routing
 * its Next/feedback/reps/skip/rest actions to the handlers of that set.
 */
export function useTrainingExerciseSheetProps({
  rows,
  exerciseList,
  repsDraft,
  timing,
  onChangeReps,
  onSubmitReps,
  onComplete,
  onRestEnd,
  onSkip,
}: Args) {
  const { activeRow, shownRow, session, ...actions } =
    useTrainingListSetNavigation({ rows, exerciseList, timing });
  const restTracker = useChecklistRest({ timing, onRestEnd });

  // A swipe during the rest ends the rest as skipped.
  const handleSheetDismiss = () => {
    restTracker.endRest(true);
    actions.handleDismiss();
  };

  // shownRow outlives activeRow while the sheet animates closed; actions
  // below still check activeRow so nothing fires during that animation.
  const sheetProps = {
    row: shownRow,
    isPresented: activeRow !== null,
    sessionKey: session,
    duration: shownRow
      ? countdownDurationOf(exerciseList?.[shownRow.index])
      : undefined,
    repsValue: shownRow ? (repsDraft[shownRow.index] ?? 0) : 0,
    rest: activeRow
      ? buildRestControl(activeRow, rows, exerciseList, restTracker)
      : undefined,
    onChangeReps: (value: string) => {
      if (activeRow) onChangeReps(activeRow.index, value);
    },
    onSubmitReps: () => {
      if (activeRow) onSubmitReps(activeRow);
    },
    onComplete: (feedback?: DifficultyFeedbackType) => {
      if (activeRow) onComplete(activeRow, feedback);
    },
    onSkip: () => {
      if (activeRow) onSkip(activeRow);
    },
    onNext: actions.handleNext,
    onDismiss: handleSheetDismiss,
  };

  return { handleStart: actions.handleStart, sheetProps };
}
