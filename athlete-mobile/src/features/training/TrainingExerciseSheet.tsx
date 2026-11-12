import { useExerciseSheetPause } from "@/features/training/hooks/useExerciseSheetPause";
import { useExerciseSheetSteps } from "@/features/training/hooks/useExerciseSheetSteps";
import { useExerciseSheetTimer } from "@/features/training/hooks/useExerciseSheetTimer";
import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type SheetRestControl } from "@/features/training/utils/checklistRest";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { BottomSheet, RNHostView } from "@expo/ui";
import { type FC } from "react";
import { useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { TrainingExerciseStats } from "./TrainingExerciseStats";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";
import { TrainingRestStep } from "./TrainingRestStep";
import {
  type PauseControl,
  TrainingSheetHeading,
} from "./TrainingSheetHeading";

// The set step needs about 450pt without the picture, so short phones such as
// a 667pt iPhone SE and phones in landscape skip it.
const SHEET_PICTURE_MIN_WINDOW_HEIGHT = 700;

export type TrainingExerciseSheetProps = {
  row: ListRow | null;
  isPresented: boolean;
  sessionKey: number;
  duration: number | undefined;
  /** Running time a resumed set continues from. */
  startElapsedMs: number;
  isScreenFocused: boolean;
  repsValue: number;
  rest?: SheetRestControl;
  onChangeReps: (value: string) => void;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onDismiss: () => void;
  onTimerStop: (index: number, elapsedMs: number) => void;
};

type ContentProps = Omit<
  TrainingExerciseSheetProps,
  "row" | "isPresented" | "sessionKey" | "isScreenFocused"
> & { row: ListRow; isTimerActive: boolean };

const FEEDBACK_ICON_SIZE = 56;

// Left to right, matching the arrows: down to the left, up to the right.
const FEEDBACK_CHOICES = [
  {
    feedback: "TOO_HARD",
    labelKey: "training.list.feedback.tooHard",
    testId: "training-list-sheet-too-hard",
  },
  {
    feedback: "SUCCEEDED",
    labelKey: "training.list.feedback.succeeded",
    testId: "training-list-sheet-checkmark",
  },
  {
    feedback: "TOO_EASY",
    labelKey: "training.list.feedback.tooEasy",
    testId: "training-list-sheet-too-easy",
  },
] as const;

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
      {FEEDBACK_CHOICES.map(({ feedback, labelKey, testId }) => (
        // Equal columns keep the icons evenly spaced whatever the label length
        <Box key={feedback} flex={1} alignItems="center">
          <FeedbackIconButton
            feedback={feedback}
            onPress={() => onSelect(feedback)}
            label={t(labelKey)}
            size={FEEDBACK_ICON_SIZE}
            testId={testId}
          />
        </Box>
      ))}
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
  onNext: () => void;
}> = ({
  row,
  repsValue,
  isCountingDown,
  steps,
  onChangeReps,
  onSkip,
  onNext,
}) => {
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
  // A skipped set never starts its rest; the rest counts as completed at
  // finish. Like the step-by-step view, Skip moves on to the next set.
  const handleSkip = () => {
    onSkip();
    onNext();
  };

  return (
    <TrainingExerciseTimerActions
      isCountingDown={isCountingDown}
      onNext={steps.handleContinue}
      onSkip={handleSkip}
    />
  );
};

const SheetSetHeading: FC<{
  row: ListRow;
  seconds: number;
  isTimed: boolean;
  pause?: PauseControl;
}> = ({ row, seconds, isTimed, pause }) => {
  const { height } = useWindowDimensions();

  return (
    <TrainingSheetHeading
      title={row.displayName}
      subtitle={row.setLabel}
      picture={
        height >= SHEET_PICTURE_MIN_WINDOW_HEIGHT
          ? { url: row.pictureUrl, valueKind: row.valueKind }
          : undefined
      }
      seconds={seconds}
      isTimed={isTimed}
      timerTestID="training-list-sheet-timer"
      pause={pause}
    >
      <TrainingExerciseStats
        targetReps={row.targetReps}
        targetWeight={row.targetWeight}
        targetDuration={row.targetDuration}
        heartRateBand={row.heartRateBand}
      />
    </TrainingSheetHeading>
  );
};

const TrainingExerciseSheetContent: FC<ContentProps> = ({
  row,
  duration,
  startElapsedMs,
  isTimerActive,
  repsValue,
  rest,
  onChangeReps,
  onSubmitReps,
  onComplete,
  onSkip,
  onPause,
  onResume,
  onNext,
  onDismiss,
  onTimerStop,
}) => {
  const pause = useExerciseSheetPause({ onPause, onResume });
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
    isActive: isTimerActive && !steps.runningRest && !pause.isPaused,
    initialElapsedMs: startElapsedMs,
    onStop: (elapsedMs) => onTimerStop(row.index, elapsedMs),
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

  return (
    <Box padding="l" gap="m" testID={`training-list-sheet-set-${row.index}`}>
      <SheetSetHeading
        row={row}
        seconds={displayedSeconds}
        isTimed={typeof duration === "number"}
        pause={row.isTest ? undefined : pause}
      />

      <SheetSetActions
        row={row}
        repsValue={repsValue}
        isCountingDown={isCountingDown}
        steps={steps}
        onChangeReps={onChangeReps}
        onSkip={onSkip}
        onNext={onNext}
      />
    </Box>
  );
};

/**
 * Bottom sheet for one set of the checklist: shows the exercise name, the set,
 * target reps and weight, a countdown (timed exercises) or stopwatch (open-ended ones), and a Next
 * step that completes the set, or first reveals the too hard, succeeded, too easy
 * choice. A planned rest after the set runs before Next opens the next set.
 * Skip stays enabled during the countdown, so an athlete can drop a set mid-way.
 * A pause button next to the timer freezes it until resumed. A set reopened
 * after enough running time continues its timer from startElapsedMs, unpaused.
 * A strength test shows the reps input instead.
 */
export const TrainingExerciseSheet: FC<TrainingExerciseSheetProps> = ({
  row,
  isPresented,
  sessionKey,
  isScreenFocused,
  ...contentProps
}) => {
  const { colors } = useTheme();

  // The native sheet follows the dark mode of the device, not the app theme,
  // so the sheet colors are set explicitly.
  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={contentProps.onDismiss}
      contentPadding={0}
      containerColor={colors.surface}
      contentColor={colors.onSurface}
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
};
