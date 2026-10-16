import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
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
  const completedLabels = {
    TOO_EASY: t("training.active.feedback.tooEasy"),
    TOO_HARD: t("training.active.feedback.tooHard"),
    SUCCEEDED: t("training.active.a11y.finishExercise"),
  };
  const completedLabel = completedLabels[completedFeedback ?? "SUCCEEDED"];

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
        ) : (
          <FeedbackIconButton
            feedback={completedFeedback ?? "SUCCEEDED"}
            onPress={() => onComplete()}
            disabled={isCompleted}
            accessibilityLabel={completedLabel}
            testId={`${testId}-checkmark`}
          />
        ))}
    </Box>
  );
};
