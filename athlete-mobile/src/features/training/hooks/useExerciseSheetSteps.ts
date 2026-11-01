import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type SheetRestControl } from "@/features/training/utils/checklistRest";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { useState } from "react";

type Args = {
  row: ListRow;
  rest: SheetRestControl | undefined;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  onDismiss: () => void;
};

/**
 * Steps of the checklist sheet: timer, then the feedback choice for a
 * feedback set, then the rest when the set list plans one after the set.
 */
export function useExerciseSheetSteps({
  row,
  rest,
  onSubmitReps,
  onComplete,
  onDismiss,
}: Args) {
  const [isChoosingFeedback, setIsChoosingFeedback] = useState(false);
  // The rest prop turns undefined once the store records the rest, so the step keeps its own copy.
  const [runningRest, setRunningRest] = useState<SheetRestControl | null>(null);

  const finishSet = () => {
    if (rest) {
      setRunningRest(rest);
      rest.onStart();
      return;
    }
    onDismiss();
  };

  const handleContinue = () => {
    if (row.isFeedbackSkill && row.isLastInSet) {
      setIsChoosingFeedback(true);
      return;
    }
    onComplete();
    finishSet();
  };

  const handleFeedbackSelect = (feedback: DifficultyFeedbackType) => {
    onComplete(feedback);
    finishSet();
  };

  const handleSaveReps = () => {
    onSubmitReps();
    finishSet();
  };

  const handleRestEnd = (skipped: boolean) => {
    runningRest?.onEnd(skipped);
    onDismiss();
  };

  return {
    isChoosingFeedback,
    runningRest,
    handleContinue,
    handleFeedbackSelect,
    handleSaveReps,
    handleRestEnd,
  };
}
