import { type ListRow } from "@/features/training/hooks/useTrainingListRows";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { TrainingListItem } from "@/features/training/TrainingListItem";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { ScrollView } from "react-native";

export type TrainingListRowsProps = {
  rows: ListRow[];
  exerciseList: UserExerciseDataType[] | null;
  repsDraft: Record<number, number>;
  onStart: (row: ListRow) => void;
  onShowInfo: (exerciseId: string) => void;
};

/** Scrollable body of the checklist: one TrainingListItem per visible row. */
export const TrainingListRows: FC<TrainingListRowsProps> = ({
  rows,
  exerciseList,
  repsDraft,
  onStart,
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
          isCompleted={row.completed}
          completedFeedback={exerciseList?.[row.index]?.feedback?.difficulty}
          repsValue={repsDraft[row.index] ?? 0}
          onStart={() => onStart(row)}
          onShowInfo={() => onShowInfo(row.exerciseId)}
        />
      ))}
    </Box>
  </ScrollView>
);
