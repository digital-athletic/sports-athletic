import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { useTrainingListSheet } from "@/features/training/hooks/useTrainingListSheet";
import { type TrainingListTiming } from "@/features/training/hooks/useTrainingListTiming";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";

type Args = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  repsDraft: Record<number, number>;
  timing: Pick<TrainingListTiming, "startExercise" | "endExercise">;
  onChangeReps: (index: number, value: string) => void;
  onSubmitReps: (row: ListRow) => void;
  onComplete: (row: ListRow, feedback?: DifficultyFeedbackType) => void;
};

/**
 * Builds TrainingExerciseSheet's props from whichever checklist row is
 * currently active, routing its Continue/feedback/reps actions back through
 * the same handlers the row itself used to call directly.
 */
export function useTrainingExerciseSheetProps({
  rows,
  exerciseList,
  repsDraft,
  timing,
  onChangeReps,
  onSubmitReps,
  onComplete,
}: Args) {
  const { activeRow, shownRow, session, openSheet, closeSheet } =
    useTrainingListSheet(rows);

  const handleStart = (row: ListRow) => {
    timing.startExercise(exerciseList?.[row.index]?.skill);
    openSheet(row.index);
  };

  const handleDismiss = () => {
    timing.endExercise();
    closeSheet();
  };

  // shownRow outlives activeRow while the sheet animates closed; actions
  // below still check activeRow so nothing fires during that animation.
  const sheetProps = {
    row: shownRow,
    isPresented: activeRow !== null,
    sessionKey: session,
    duration: shownRow ? exerciseList?.[shownRow.index]?.duration : undefined,
    repsValue: shownRow ? (repsDraft[shownRow.index] ?? 0) : 0,
    onChangeReps: (value: string) => {
      if (activeRow) onChangeReps(activeRow.index, value);
    },
    onSubmitReps: () => {
      if (activeRow) onSubmitReps(activeRow);
    },
    onComplete: (feedback?: DifficultyFeedbackType) => {
      if (activeRow) onComplete(activeRow, feedback);
    },
    onDismiss: handleDismiss,
  };

  return { handleStart, sheetProps };
}
