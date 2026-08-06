import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { TrainingListItemActions } from "./TrainingListItemActions";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";

export type TrainingListItemProps = {
  displayName: string;
  setLabel?: string;
  isTest: boolean;
  isFeedbackEligible: boolean;
  isCompleted: boolean;
  /** Which feedback (if any) was chosen when this row was completed. */
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  onChangeReps: (value: string) => void;
  onSubmitReps: () => void;
  onComplete: (feedback?: DifficultyFeedbackType) => void;
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

        <TrainingListItemActions
          isTest={isTest}
          isCompleted={isCompleted}
          isFeedbackEligible={isFeedbackEligible}
          completedFeedback={completedFeedback}
          repsValue={repsValue}
          onComplete={onComplete}
          onSkip={onSkip}
          testId={testId}
        />
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
