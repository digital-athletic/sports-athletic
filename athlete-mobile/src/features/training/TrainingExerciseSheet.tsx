import { useExerciseSheetSteps } from "@/features/training/hooks/useExerciseSheetSteps";
import { useExerciseSheetTimer } from "@/features/training/hooks/useExerciseSheetTimer";
import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type SheetRestControl } from "@/features/training/utils/checklistRest";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { BottomSheet, RNHostView } from "@expo/ui";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";
import { TrainingRestStep } from "./TrainingRestStep";
import { TrainingSheetHeading } from "./TrainingSheetHeading";

export type TrainingExerciseSheetProps = {
  row: ListRow | null;
  isPresented: boolean;
  sessionKey: number;
  duration: number | undefined;
  isScreenFocused: boolean;
  repsValue: number;
  rest?: SheetRestControl;
  onChangeReps: (value: string) => void;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  onSkip: () => void;
  onNext: () => void;
  onDismiss: () => void;
};

type ContentProps = Omit<
  TrainingExerciseSheetProps,
  "row" | "isPresented" | "sessionKey" | "isScreenFocused"
> & { row: ListRow; isTimerActive: boolean };

const TrainingExerciseFeedbackChoice: FC<{
  onSelect: (feedback: DifficultyFeedbackType) => void;
}> = ({ onSelect }) => {
  const { t } = useTranslation();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap="m"
    >
      <FeedbackIconButton
        feedback="TOO_EASY"
        onPress={() => onSelect("TOO_EASY")}
        accessibilityLabel={t("training.active.feedback.tooEasy")}
        testId="training-list-sheet-too-easy"
      />
      <FeedbackIconButton
        feedback="SUCCEEDED"
        onPress={() => onSelect("SUCCEEDED")}
        accessibilityLabel={t("training.active.a11y.finishExercise")}
        testId="training-list-sheet-checkmark"
      />
      <FeedbackIconButton
        feedback="TOO_HARD"
        onPress={() => onSelect("TOO_HARD")}
        accessibilityLabel={t("training.active.feedback.tooHard")}
        testId="training-list-sheet-too-hard"
      />
    </Box>
  );
};

const TrainingExerciseTimerActions: FC<{
  isCountingDown: boolean;
  onNext: () => void;
  onSkip: () => void;
}> = ({ isCountingDown, onNext, onSkip }) => {
  const { t } = useTranslation();

  return (
    <>
      <Button
        variant="primary"
        onPress={onNext}
        disabled={isCountingDown}
        style={{ opacity: isCountingDown ? 0.5 : 1 }}
        testID="training-list-sheet-next"
      >
        {t("training.list.nextSet")}
      </Button>
      <Button
        variant="secondary"
        onPress={onSkip}
        accessibilityLabel={t("training.list.skipExercise")}
        testID="training-list-sheet-skip"
      >
        {t("training.list.skipExercise")}
      </Button>
    </>
  );
};

const SheetSetActions: FC<{
  row: ListRow;
  repsValue: number;
  isCountingDown: boolean;
  steps: ReturnType<typeof useExerciseSheetSteps>;
  onChangeReps: (value: string) => void;
  onSkip: () => void;
}> = ({ row, repsValue, isCountingDown, steps, onChangeReps, onSkip }) => {
  if (row.isTest) {
    return (
      <TrainingRepetitionInput
        compact
        exerciseName={row.displayName}
        repsValue={repsValue}
        changeReps={onChangeReps}
        saveRepsInput={steps.handleSaveReps}
        inputTestID="training-list-sheet-reps-input"
        saveTestID="training-list-sheet-reps-save"
      />
    );
  }
  if (steps.isChoosingFeedback) {
    return (
      <TrainingExerciseFeedbackChoice onSelect={steps.handleFeedbackSelect} />
    );
  }
  return (
    <TrainingExerciseTimerActions
      isCountingDown={isCountingDown}
      onNext={steps.handleContinue}
      onSkip={onSkip}
    />
  );
};

const TrainingExerciseSheetContent: FC<ContentProps> = ({
  row,
  duration,
  isTimerActive,
  repsValue,
  rest,
  onChangeReps,
  onSubmitReps,
  onComplete,
  onSkip,
  onNext,
  onDismiss,
}) => {
  const steps = useExerciseSheetSteps({
    row,
    rest,
    onSubmitReps,
    onComplete,
    onNext,
    onDismiss,
  });

  const { displayedSeconds, isCountingDown } = useExerciseSheetTimer({
    exerciseId: row.exerciseId,
    duration,
    isActive: isTimerActive && !steps.runningRest,
  });

  if (steps.runningRest) {
    return (
      <Box padding="l">
        <TrainingRestStep
          rest={steps.runningRest.plan}
          isActive={isTimerActive}
          onEnd={steps.handleRestEnd}
        />
      </Box>
    );
  }

  // A skipped set never starts its rest; the rest counts as completed at
  // finish. Like the step-by-step view, Skip moves on to the next set.
  const handleSkip = () => {
    onSkip();
    onNext();
  };

  return (
    <Box padding="l" gap="m" testID={`training-list-sheet-set-${row.index}`}>
      <TrainingSheetHeading
        title={row.displayName}
        subtitle={row.setLabel}
        seconds={displayedSeconds}
        isTimed={typeof duration === "number"}
        timerTestID="training-list-sheet-timer"
      />

      <SheetSetActions
        row={row}
        repsValue={repsValue}
        isCountingDown={isCountingDown}
        steps={steps}
        onChangeReps={onChangeReps}
        onSkip={handleSkip}
      />
    </Box>
  );
};

/**
 * Bottom sheet for one set of the checklist: shows the exercise name, the set,
 * a countdown (timed exercises) or stopwatch (open-ended ones), and a Next
 * step that completes the set, or first reveals the too-easy/succeeded/too-hard
 * choice. A planned rest after the set runs before Next opens the next set.
 * Skip stays enabled during the countdown, so an athlete can drop a set mid-way.
 * A strength test shows the reps input instead.
 */
export const TrainingExerciseSheet: FC<TrainingExerciseSheetProps> = ({
  row,
  isPresented,
  sessionKey,
  isScreenFocused,
  ...contentProps
}) => (
  <BottomSheet
    isPresented={isPresented}
    onDismiss={contentProps.onDismiss}
    contentPadding={0}
    testID="training-list-sheet"
  >
    {row && (
      <RNHostView matchContents={{ vertical: true }}>
        <TrainingExerciseSheetContent
          key={sessionKey}
          row={row}
          isTimerActive={isPresented && isScreenFocused}
          {...contentProps}
        />
      </RNHostView>
    )}
  </BottomSheet>
);
