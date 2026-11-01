import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type SheetRestControl } from "@/features/training/utils/checklistRest";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { useState } from "react";

type Args = {
  row: ListRow;
  rest: SheetRestControl | undefined;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  onNext: () => void;
  onDismiss: () => void;
};

type RunningRest = { control: SheetRestControl; onDone: () => void };

/**
 * Steps of the checklist sheet: timer, then the feedback choice for a
 * feedback set, then the rest when the set list plans one after the set.
 * A completed set moves on to the next set; saved reps close the sheet.
 */
export function useExerciseSheetSteps({
  row,
  rest,
  onSubmitReps,
  onComplete,
  onNext,
  onDismiss,
}: Args) {
  const [isChoosingFeedback, setIsChoosingFeedback] = useState(false);
  // The rest prop turns undefined once the store records the rest, so the step keeps its own copy.
  const [runningRest, setRunningRest] = useState<RunningRest | null>(null);

  const finishSet = (onDone: () => void) => {
    if (rest) {
      setRunningRest({ control: rest, onDone });
      rest.onStart();
      return;
    }
    onDone();
  };

  const handleContinue = () => {
    if (row.isFeedbackSkill && row.isLastInSet) {
      setIsChoosingFeedback(true);
      return;
    }
    onComplete();
    finishSet(onNext);
  };

  const handleFeedbackSelect = (feedback: DifficultyFeedbackType) => {
    onComplete(feedback);
    finishSet(onNext);
  };

  const handleSaveReps = () => {
    onSubmitReps();
    finishSet(onDismiss);
  };

  const handleRestEnd = (skipped: boolean) => {
    runningRest?.control.onEnd(skipped);
    runningRest?.onDone();
  };

  return {
    isChoosingFeedback,
    runningRest: runningRest?.control ?? null,
    handleContinue,
    handleFeedbackSelect,
    handleSaveReps,
    handleRestEnd,
  };
}
