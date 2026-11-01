import {
  type ChecklistEntry,
  type ChecklistEntryBlock,
} from "@/features/training/hooks/useTrainingListRows";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { TrainingListItem } from "@/features/training/TrainingListItem";
import { Box } from "@/theme/Box";
import { type FC } from "react";
import { ScrollView } from "react-native";

export type TrainingListRowsProps = {
  blocks: ChecklistEntryBlock[];
  exerciseList: UserExerciseDataType[] | null;
  repsDraft: Record<number, number>;
  onStart: (entry: ChecklistEntry) => void;
  onShowInfo: (exerciseId: string) => void;
};

type EntryProps = Omit<TrainingListRowsProps, "blocks"> & {
  entry: ChecklistEntry;
  isNext: boolean;
};

const Entry: FC<EntryProps> = ({
  entry,
  isNext,
  exerciseList,
  repsDraft,
  onStart,
  onShowInfo,
}) => {
  // Feedback belongs to the last set of the exercise.
  const lastSetIndex = entry.sets.at(-1)?.index ?? entry.key;

  return (
    <TrainingListItem
      testId={`training-list-row-${entry.key}`}
      displayName={entry.displayName}
      sets={entry.sets}
      isNext={isNext}
      isTest={entry.isTest}
      isCompleted={entry.completed}
      completedFeedback={exerciseList?.[lastSetIndex]?.feedback?.difficulty}
      repsValue={repsDraft[entry.key] ?? 0}
      onStart={() => onStart(entry)}
      onShowInfo={() => onShowInfo(entry.exerciseId)}
    />
  );
};

/**
 * Scrollable body of the checklist: one TrainingListItem per exercise. The
 * exercises of a superset share a framed box, and an arrow marks the one
 * whose set comes next.
 */
export const TrainingListRows: FC<TrainingListRowsProps> = ({
  blocks,
  ...entryProps
}) => (
  <ScrollView keyboardShouldPersistTaps="handled">
    <Box padding="l">
      {blocks.map((block) =>
        block.isSuperset ? (
          <Box
            key={block.key}
            testID={`training-list-superset-${block.key}`}
            borderWidth={1}
            borderColor="lightGrey3"
            borderRadius="m"
            paddingHorizontal="m"
            marginVertical="s"
          >
            {block.entries.map((entry) => (
              <Entry
                key={entry.key}
                entry={entry}
                isNext={entry.key === block.nextEntryKey}
                {...entryProps}
              />
            ))}
          </Box>
        ) : (
          block.entries.map((entry) => (
            <Entry
              key={entry.key}
              entry={entry}
              isNext={false}
              {...entryProps}
            />
          ))
        ),
      )}
    </Box>
  </ScrollView>
);
