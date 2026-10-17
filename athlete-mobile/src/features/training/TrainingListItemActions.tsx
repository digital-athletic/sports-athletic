import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type TFunction } from "i18next";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { SkipExerciseButton } from "./SkipExerciseButton";

export type TrainingListItemActionsProps = {
  isTest: boolean;
  isCompleted: boolean;
  isFeedbackEligible: boolean;
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  onSkip: () => void;
  testId: string;
};

const COMPLETED_LABEL_KEYS = {
  TOO_EASY: "training.active.a11y.completedTooEasy",
  TOO_HARD: "training.active.a11y.completedTooHard",
  SUCCEEDED: "training.active.a11y.completedSucceeded",
} as const;

/** Pending rows get the action name, completed rows the recorded result. */
const checkLabel = (
  t: TFunction,
  isCompleted: boolean,
  feedback: DifficultyFeedbackType | null | undefined,
): string =>
  isCompleted
    ? t(COMPLETED_LABEL_KEYS[feedback ?? "SUCCEEDED"])
    : t("training.active.a11y.finishExercise");

const FeedbackRow: FC<{
  onComplete: (feedback?: DifficultyFeedbackType) => void;
  testId: string;
}> = ({ onComplete, testId }) => {
  const { t } = useTranslation();

  return (
    <Box flexDirection="row" alignItems="center" gap="m">
      <FeedbackIconButton
        feedback="TOO_EASY"
        onPress={() => onComplete("TOO_EASY")}
        accessibilityLabel={t("training.active.feedback.tooEasy")}
        testId={`${testId}-too-easy`}
      />
      <FeedbackIconButton
        feedback="SUCCEEDED"
        onPress={() => onComplete("SUCCEEDED")}
        accessibilityLabel={t("training.active.a11y.finishExercise")}
        testId={`${testId}-checkmark`}
      />
      <FeedbackIconButton
        feedback="TOO_HARD"
        onPress={() => onComplete("TOO_HARD")}
        accessibilityLabel={t("training.active.feedback.tooHard")}
        testId={`${testId}-too-hard`}
      />
    </Box>
  );
};

/**
 * The skip / reps-count / checkmark-or-feedback-icons controls for a single
 * checklist row, split out of TrainingListItem to keep its own branching
 * (test vs normal exercise, completed vs pending, feedback-eligible or not)
 * isolated from the row's layout.
 */
export const TrainingListItemActions: FC<TrainingListItemActionsProps> = ({
  isTest,
  isCompleted,
  isFeedbackEligible,
  completedFeedback,
  repsValue,
  onComplete,
  onSkip,
  testId,
}) => {
  const { t } = useTranslation();
  const showFeedbackRow = !isCompleted && isFeedbackEligible;

  return (
    <Box flexDirection="row" alignItems="center" gap="m">
      {!isTest && (
        <SkipExerciseButton
          onPress={onSkip}
          disabled={isCompleted}
          testId={`${testId}-skip`}
        />
      )}

      {isTest && isCompleted && repsValue > 0 && (
        <Text variant="small" color="darkGrey1">
          {t("training.overview.repetitions", { count: repsValue })}
        </Text>
      )}

      {(!isTest || isCompleted) &&
        (showFeedbackRow ? (
          <FeedbackRow onComplete={onComplete} testId={testId} />
        ) : (
          <FeedbackIconButton
            feedback={completedFeedback ?? "SUCCEEDED"}
            onPress={() => onComplete()}
            disabled={isCompleted}
            accessibilityLabel={checkLabel(t, isCompleted, completedFeedback)}
            testId={`${testId}-checkmark`}
          />
        ))}
    </Box>
  );
};
