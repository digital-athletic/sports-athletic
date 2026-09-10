import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { TrainingListItem } from "@/features/training/TrainingListItem";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { ScrollView } from "react-native";

export type TrainingListRowsProps = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  repsDraft: Record<number, number>;
  onComplete: (row: ListRow, feedback?: DifficultyFeedbackType) => void;
  onSkip: (row: ListRow) => void;
  onSubmitReps: (row: ListRow) => void;
  onChangeReps: (index: number, value: string) => void;
  onShowInfo: (exerciseId: string) => void;
};

/** Scrollable body of the checklist: one TrainingListItem per visible row. */
export const TrainingListRows: FC<TrainingListRowsProps> = ({
  rows,
  exerciseList,
  repsDraft,
  onComplete,
  onSkip,
  onSubmitReps,
  onChangeReps,
  onShowInfo,
}) => (
  <ScrollView keyboardShouldPersistTaps="handled">
    <Box padding="l">
      {rows.map((row) => (
        <TrainingListItem
          key={row.index}
          testId={`training-list-row-${row.index}`}
          displayName={row.displayName}
          setLabel={row.setLabel}
          isTest={row.isTest}
          isFeedbackEligible={row.isFeedbackSkill && row.isLastInSet}
          isCompleted={row.completed}
          completedFeedback={exerciseList?.[row.index]?.feedback?.difficulty}
          repsValue={repsDraft[row.index] ?? 0}
          onChangeReps={(value) => onChangeReps(row.index, value)}
          onSubmitReps={() => onSubmitReps(row)}
          onComplete={(feedback) => onComplete(row, feedback)}
          onSkip={() => onSkip(row)}
          onShowInfo={() => onShowInfo(row.exerciseId)}
        />
      ))}
    </Box>
  </ScrollView>
);
