import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type TFunction } from "i18next";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FeedbackIconButton } from "./FeedbackIconButton";
import { InfoExerciseButton } from "./InfoExerciseButton";
import { SkipExerciseButton } from "./SkipExerciseButton";
import { StartExerciseButton } from "./StartExerciseButton";

export type TrainingListItemActionsProps = {
  isTest: boolean;
  isCompleted: boolean;
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  onStart: () => void;
  onShowInfo: () => void;
  onSkip: () => void;
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
 * The info / skip / start-or-checkmark controls for a single checklist row.
 * Starting (and the timer/feedback/reps flow that follows) happens in the
 * TrainingExerciseSheet opened by onStart, not inline here.
 */
export const TrainingListItemActions: FC<TrainingListItemActionsProps> = ({
  isTest,
  isCompleted,
  completedFeedback,
  repsValue,
  onStart,
  onShowInfo,
  onSkip,
  testId,
}) => {
  const { t } = useTranslation();

  return (
    <Box flexDirection="row" alignItems="center" gap="m">
      <InfoExerciseButton onPress={onShowInfo} testId={`${testId}-info`} />

      {!isTest && !isCompleted && (
        <SkipExerciseButton onPress={onSkip} testId={`${testId}-skip`} />
      )}

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
        <StartExerciseButton onPress={onStart} testId={`${testId}-start`} />
      )}
    </Box>
  );
};
