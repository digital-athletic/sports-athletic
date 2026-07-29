import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";

export type TrainingListItemFeedback = "TOO_EASY" | "TOO_HARD" | "SUCCEEDED";

const FEEDBACK_ICON = {
  TOO_EASY: {
    outline: "arrow-down-circle-outline",
    filled: "arrow-down-circle",
    color: "info",
  },
  SUCCEEDED: {
    outline: "checkmark-circle-outline",
    filled: "checkmark-circle",
    color: "darkGrey2",
  },
  TOO_HARD: {
    outline: "arrow-up-circle-outline",
    filled: "arrow-up-circle",
    color: "error",
  },
} as const;

export type TrainingListItemProps = {
  displayName: string;
  setLabel?: string;
  isTest: boolean;
  isFeedbackEligible: boolean;
  isCompleted: boolean;
  /** Which feedback (if any) was chosen when this row was completed. */
  completedFeedback?: TrainingListItemFeedback | null;
  repsValue: number;
  onChangeReps: (value: string) => void;
  onSubmitReps: () => void;
  onComplete: (feedback?: TrainingListItemFeedback) => void;
  onSkip: () => void;
  onShowInfo: () => void;
  /** Base identifier for this row, used to derive per-control testIDs (e2e). */
  testId: string;
};

/**
 * A single row in the list-view training checklist: exercise name plus
 * either a checkmark (normal exercises) or a compact reps input (strength
 * tests), matching the completion controls used in the one-by-one flow.
 */
export const TrainingListItem: FC<TrainingListItemProps> = ({
  displayName,
  setLabel,
  isTest,
  isFeedbackEligible,
  isCompleted,
  completedFeedback,
  repsValue,
  onChangeReps,
  onSubmitReps,
  onComplete,
  onSkip,
  onShowInfo,
  testId,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      testID={testId}
      borderBottomWidth={1}
      borderBottomColor="lightGrey2"
      paddingVertical="m"
    >
      <Box flexDirection="row" alignItems="center">
        <TouchableBox flex={1} onPress={onShowInfo}>
          <Box opacity={isCompleted ? 0.5 : 1}>
            <Text variant="body">{displayName}</Text>
            {setLabel && (
              <Text variant="small" color="darkGrey1">
                {setLabel}
              </Text>
            )}
          </Box>
        </TouchableBox>

        <Box flexDirection="row" alignItems="center" gap="m">
          {!isTest && (
            <TouchableBox
              onPress={onSkip}
              disabled={isCompleted}
              minWidth={32}
              minHeight={32}
              justifyContent="center"
              alignItems="center"
              accessibilityLabel={t("training.list.skipExercise")}
              testID={`${testId}-skip`}
            >
              <Box opacity={isCompleted ? 0 : 1}>
                <Ionicon
                  name="play-forward"
                  size={20}
                  color={colors.darkGrey2}
                />
              </Box>
            </TouchableBox>
          )}

          {isTest && isCompleted && repsValue > 0 && (
            <Text variant="small" color="darkGrey1">
              {t("training.overview.repetitions", { count: repsValue })}
            </Text>
          )}

          {(!isTest || isCompleted) &&
            (isCompleted ? (
              <TouchableBox
                onPress={() => onComplete()}
                disabled
                minWidth={36}
                minHeight={36}
                justifyContent="center"
                alignItems="center"
                testID={`${testId}-checkmark`}
              >
                <Ionicon
                  name={FEEDBACK_ICON[completedFeedback ?? "SUCCEEDED"].filled}
                  size={32}
                  color={
                    colors[
                      FEEDBACK_ICON[completedFeedback ?? "SUCCEEDED"].color
                    ]
                  }
                />
              </TouchableBox>
            ) : isFeedbackEligible ? (
              <Box flexDirection="row" alignItems="center" gap="m">
                <TouchableBox
                  onPress={() => onComplete("TOO_EASY")}
                  minWidth={36}
                  minHeight={36}
                  justifyContent="center"
                  alignItems="center"
                  accessibilityLabel={t("training.active.feedback.tooEasy")}
                  testID={`${testId}-too-easy`}
                >
                  <Ionicon
                    name={FEEDBACK_ICON.TOO_EASY.outline}
                    size={32}
                    color={colors[FEEDBACK_ICON.TOO_EASY.color]}
                  />
                </TouchableBox>
                <TouchableBox
                  onPress={() => onComplete()}
                  minWidth={36}
                  minHeight={36}
                  justifyContent="center"
                  alignItems="center"
                  testID={`${testId}-checkmark`}
                >
                  <Ionicon
                    name={FEEDBACK_ICON.SUCCEEDED.outline}
                    size={32}
                    color={colors[FEEDBACK_ICON.SUCCEEDED.color]}
                  />
                </TouchableBox>
                <TouchableBox
                  onPress={() => onComplete("TOO_HARD")}
                  minWidth={36}
                  minHeight={36}
                  justifyContent="center"
                  alignItems="center"
                  accessibilityLabel={t("training.active.feedback.tooHard")}
                  testID={`${testId}-too-hard`}
                >
                  <Ionicon
                    name={FEEDBACK_ICON.TOO_HARD.outline}
                    size={32}
                    color={colors[FEEDBACK_ICON.TOO_HARD.color]}
                  />
                </TouchableBox>
              </Box>
            ) : (
              <TouchableBox
                onPress={() => onComplete()}
                minWidth={36}
                minHeight={36}
                justifyContent="center"
                alignItems="center"
                testID={`${testId}-checkmark`}
              >
                <Ionicon
                  name={FEEDBACK_ICON.SUCCEEDED.outline}
                  size={32}
                  color={colors[FEEDBACK_ICON.SUCCEEDED.color]}
                />
              </TouchableBox>
            ))}
        </Box>
      </Box>

      {!isCompleted && isTest && (
        <Box marginTop="s">
          <TrainingRepetitionInput
            compact
            repsValue={repsValue}
            changeReps={onChangeReps}
            saveRepsInput={onSubmitReps}
            inputTestID={`${testId}-reps-input`}
            saveTestID={`${testId}-reps-save`}
          />
        </Box>
      )}
    </Box>
  );
};
