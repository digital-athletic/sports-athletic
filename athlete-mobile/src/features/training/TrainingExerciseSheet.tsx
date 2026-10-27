import { useExerciseSheetTimer } from "@/features/training/hooks/useExerciseSheetTimer";
import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { secondsToMMSS } from "@/utils/date";
import { BottomSheet, RNHostView } from "@expo/ui";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";

export type TrainingExerciseSheetProps = {
  row: ListRow | null;
  isPresented: boolean;
  sessionKey: number;
  duration: number | undefined;
  isScreenFocused: boolean;
  repsValue: number;
  onChangeReps: (value: string) => void;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
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

const SheetHeading: FC<{ title: string; seconds: number }> = ({
  title,
  seconds,
}) => (
  <>
    <Text variant="title" textAlign="center">
      {title}
    </Text>
    <Text fontSize={32} fontWeight="300" textAlign="center">
      {secondsToMMSS(seconds)}
    </Text>
  </>
);

const TrainingExerciseSheetContent: FC<ContentProps> = ({
  row,
  duration,
  isTimerActive,
  repsValue,
  onChangeReps,
  onSubmitReps,
  onComplete,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<"timer" | "feedback">("timer");

  const { displayedSeconds, isCountingDown } = useExerciseSheetTimer({
    exerciseId: row.exerciseId,
    duration,
    isActive: isTimerActive,
  });

  const isFeedbackEligible = row.isFeedbackSkill && row.isLastInSet;

  const handleContinue = () => {
    if (isFeedbackEligible) {
      setStep("feedback");
      return;
    }
    onComplete();
    onDismiss();
  };

  const handleFeedbackSelect = (feedback: DifficultyFeedbackType) => {
    onComplete(feedback);
    onDismiss();
  };

  return (
    <Box padding="l" gap="m">
      <SheetHeading title={row.displayName} seconds={displayedSeconds} />

      {row.isTest ? (
        <TrainingRepetitionInput
          compact
          exerciseName={row.displayName}
          repsValue={repsValue}
          changeReps={onChangeReps}
          saveRepsInput={() => {
            onSubmitReps();
            onDismiss();
          }}
          inputTestID="training-list-sheet-reps-input"
          saveTestID="training-list-sheet-reps-save"
        />
      ) : step === "timer" ? (
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={isCountingDown}
          style={{ opacity: isCountingDown ? 0.5 : 1 }}
          testID="training-list-sheet-continue"
        >
          {t("training.list.continueExercise")}
        </Button>
      ) : (
        <TrainingExerciseFeedbackChoice onSelect={handleFeedbackSelect} />
      )}
    </Box>
  );
};

/**
 * Bottom sheet opened from a checklist row's Start button: shows the
 * exercise name, a countdown (timed exercises) or stopwatch (open-ended
 * ones), and a Continue step that either closes the sheet, reveals the
 * too-easy/succeeded/too-hard choice, or (strength tests) the reps input.
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
