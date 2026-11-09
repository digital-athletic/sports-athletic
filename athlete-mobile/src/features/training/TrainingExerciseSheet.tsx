import { getExerciseById } from "@/data/exerciseRegistry";
import { useExerciseSheetPause } from "@/features/training/hooks/useExerciseSheetPause";
import { useExerciseSheetSteps } from "@/features/training/hooks/useExerciseSheetSteps";
import { useExerciseSheetTimer } from "@/features/training/hooks/useExerciseSheetTimer";
import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type SheetRestControl } from "@/features/training/utils/checklistRest";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { BottomSheet, RNHostView } from "@expo/ui";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import { ExerciseInfoButton } from "./ExerciseInfoButton";
import { FeedbackIconButton } from "./FeedbackIconButton";
import {
  INFO_SNAP_POINTS,
  TrainingExerciseInfoView,
} from "./TrainingExerciseInfoView";
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
};

type ContentProps = Omit<
  TrainingExerciseSheetProps,
  "row" | "isPresented" | "sessionKey" | "isScreenFocused"
> & {
  row: ListRow;
  isTimerActive: boolean;
  isShowingInfo: boolean;
  onToggleInfo: (isShowing: boolean) => void;
};

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

const SheetSetHeading: FC<{
  row: ListRow;
  seconds: number;
  isTimed: boolean;
  pause?: PauseControl;
  onShowInfo?: () => void;
}> = ({ row, seconds, isTimed, pause, onShowInfo }) => {
  const { t } = useTranslation();
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
      accessory={
        onShowInfo && (
          <ExerciseInfoButton
            onPress={onShowInfo}
            accessibilityLabel={t("training.active.a11y.showExerciseInfo")}
            testID="training-list-sheet-info"
          />
        )
      }
    >
      <TrainingExerciseStats
        targetReps={row.targetReps}
        targetWeight={row.targetWeight}
      />
    </TrainingSheetHeading>
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
  onPause,
  onResume,
  onNext,
  onDismiss,
  isShowingInfo,
  onToggleInfo,
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

  // Rendered after the hooks above, so the timer keeps running behind the info.
  const exercise = getExerciseById(row.exerciseId);
  if (isShowingInfo && exercise) {
    return (
      <TrainingExerciseInfoView
        exercise={exercise}
        title={row.displayName}
        isTimerActive={isTimerActive}
        onBack={() => onToggleInfo(false)}
      />
    );
  }

  return (
    <SheetSetView
      row={row}
      steps={steps}
      seconds={displayedSeconds}
      isTimed={typeof duration === "number"}
      isCountingDown={isCountingDown}
      repsValue={repsValue}
      pause={row.isTest ? undefined : pause}
      onShowInfo={exercise ? () => onToggleInfo(true) : undefined}
      onChangeReps={onChangeReps}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
};

const SheetSetView: FC<{
  row: ListRow;
  steps: ReturnType<typeof useExerciseSheetSteps>;
  seconds: number;
  isTimed: boolean;
  isCountingDown: boolean;
  repsValue: number;
  pause?: PauseControl;
  onShowInfo?: () => void;
  onChangeReps: (value: string) => void;
  onSkip: () => void;
  onNext: () => void;
}> = ({
  row,
  seconds,
  isTimed,
  pause,
  onShowInfo,
  onSkip,
  onNext,
  ...actions
}) => {
  // A skipped set never starts its rest; the rest counts as completed at
  // finish. Like the step-by-step view, Skip moves on to the next set.
  const handleSkip = () => {
    onSkip();
    onNext();
  };

  return (
    <Box padding="l" gap="m" testID={`training-list-sheet-set-${row.index}`}>
      <SheetSetHeading
        row={row}
        seconds={seconds}
        isTimed={isTimed}
        pause={pause}
        onShowInfo={onShowInfo}
      />
      <SheetSetActions row={row} onSkip={handleSkip} {...actions} />
    </Box>
  );
};

/**
 * Bottom sheet for one set of the checklist: shows the exercise name, the set,
 * target reps and weight, a countdown (timed exercises) or stopwatch (open-ended ones), and a Next
 * step that completes the set, or first reveals the too-easy/succeeded/too-hard
 * choice. A planned rest after the set runs before Next opens the next set.
 * Skip stays enabled during the countdown, so an athlete can drop a set mid-way.
 * A pause button next to the timer freezes it until resumed; closing the sheet
 * drops the pause with the timer. A strength test shows the reps input instead.
 * The info button swaps in the exercise's video, equipment, hints and muscles
 * without leaving the set.
 */
export const TrainingExerciseSheet: FC<TrainingExerciseSheetProps> = ({
  row,
  isPresented,
  sessionKey,
  isScreenFocused,
  ...contentProps
}) => {
  // Keyed by session, so every newly opened set starts on the set view.
  const [infoSession, setInfoSession] = useState<number | null>(null);
  const isShowingInfo = infoSession === sessionKey;

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={contentProps.onDismiss}
      contentPadding={0}
      snapPoints={isShowingInfo ? INFO_SNAP_POINTS : undefined}
      testID="training-list-sheet"
    >
      {row && (
        <RNHostView matchContents={{ vertical: true }}>
          <TrainingExerciseSheetContent
            key={sessionKey}
            row={row}
            isTimerActive={isPresented && isScreenFocused}
            isShowingInfo={isShowingInfo}
            onToggleInfo={(isShowing) =>
              setInfoSession(isShowing ? sessionKey : null)
            }
            {...contentProps}
          />
        </RNHostView>
      )}
    </BottomSheet>
  );
};
