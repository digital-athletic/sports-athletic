import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { TrainingListItemActions } from "./TrainingListItemActions";

export type TrainingListItemProps = {
  displayName: string;
  setLabel?: string;
  isTest: boolean;
  isCompleted: boolean;
  /** Which feedback (if any) was chosen when this row was completed. */
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  onStart: () => void;
  onShowInfo: () => void;
  /** Base identifier for this row, used to derive per-control testIDs (e2e). */
  testId: string;
};

/**
 * A single row in the list-view training checklist: exercise name plus
 * a start control. Starting opens the TrainingExerciseSheet, which
 * carries the timer, reps input, and feedback flow for this row.
 */
export const TrainingListItem: FC<TrainingListItemProps> = ({
  displayName,
  setLabel,
  isTest,
  isCompleted,
  completedFeedback,
  repsValue,
  onStart,
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
          completedFeedback={completedFeedback}
          repsValue={repsValue}
          onStart={onStart}
          testId={testId}
        />
      </Box>
    </Box>
  );
};
