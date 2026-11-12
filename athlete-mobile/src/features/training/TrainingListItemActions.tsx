import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type TFunction } from "i18next";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { RetakeExerciseButton } from "./RetakeExerciseButton";
import { StartExerciseButton } from "./StartExerciseButton";

export type TrainingListItemActionsProps = {
  /** True for the one exercise whose start button is filled. */
  isFeatured: boolean;
  isTest: boolean;
  isCompleted: boolean;
  skippedCount: number;
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  resumeSeconds?: number;
  onStart: () => void;
  onRetake: () => void;
  testId: string;
};

const COMPLETED_LABEL_KEYS = {
  TOO_EASY: "training.active.a11y.completedTooEasy",
  TOO_HARD: "training.active.a11y.completedTooHard",
  SUCCEEDED: "training.active.a11y.completedSucceeded",
} as const;

const checkLabel = (
  t: TFunction,
  feedback: DifficultyFeedbackType | null | undefined,
): string => t(COMPLETED_LABEL_KEYS[feedback ?? "SUCCEEDED"]);

/**
 * The start, retake or checkmark control for a single checklist row. A row
 * with skipped sets offers Retake, plus Start while other sets are still open.
 * The timer/feedback/reps flow happens in the TrainingExerciseSheet.
 */
export const TrainingListItemActions: FC<TrainingListItemActionsProps> = ({
  isFeatured,
  isTest,
  isCompleted,
  skippedCount,
  completedFeedback,
  repsValue,
  resumeSeconds,
  onStart,
  onRetake,
  testId,
}) => {
  const { t } = useTranslation();
  const startButton = (
    <StartExerciseButton
      isFeatured={isFeatured}
      onPress={onStart}
      resumeSeconds={resumeSeconds}
      testId={`${testId}-start`}
    />
  );

  // The skipped note itself sits under the set summary in TrainingListItem.
  if (skippedCount > 0) {
    return (
      <Box flexDirection="row" alignItems="center" gap="m">
        <RetakeExerciseButton onPress={onRetake} testId={`${testId}-retake`} />
        {!isCompleted && startButton}
      </Box>
    );
  }

  return (
    <Box flexDirection="row" alignItems="center" gap="m">
      {isTest && isCompleted && repsValue > 0 && (
        <Text variant="small" color="darkGrey1">
          {t("training.overview.repetitions", { count: repsValue })}
        </Text>
      )}

      {isCompleted ? (
        <FeedbackIconButton
          feedback={completedFeedback ?? "SUCCEEDED"}
          onPress={() => {}}
          disabled
          accessibilityLabel={checkLabel(t, completedFeedback)}
          testId={`${testId}-checkmark`}
        />
      ) : (
        startButton
      )}
    </Box>
  );
};
