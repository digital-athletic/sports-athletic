import {
  type ChecklistEntry,
  type ChecklistEntryBlock,
} from "@/features/training/hooks/useTrainingListRows";
import { type UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import { SkillTitle } from "@/features/training/SkillTitle";
import { TrainingListItem } from "@/features/training/TrainingListItem";
import { Box } from "@/theme/Box";
import { type FC, Fragment } from "react";
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

type BlockProps = Omit<TrainingListRowsProps, "blocks"> & {
  block: ChecklistEntryBlock;
};

const Block: FC<BlockProps> = ({ block, ...entryProps }) =>
  block.isSuperset ? (
    <Box
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
      <Entry key={entry.key} entry={entry} isNext={false} {...entryProps} />
    ))
  );

/**
 * Scrollable body of the checklist: one TrainingListItem per exercise. As in
 * the overview, a skill title starts wherever the skill changes. A superset
 * shares a framed box, and an arrow marks the exercise whose set comes next.
 */
export const TrainingListRows: FC<TrainingListRowsProps> = ({
  blocks,
  ...entryProps
}) => (
  <ScrollView keyboardShouldPersistTaps="handled">
    <Box padding="l">
      {blocks.map((block, index) => {
        const previousSkill = blocks[index - 1]?.skill;
        return (
          <Fragment key={block.key}>
            {block.skill !== previousSkill && (
              <Box marginTop={index > 0 ? "l" : undefined}>
                <SkillTitle
                  skill={block.skill}
                  testID={`training-list-skill-${block.key}`}
                />
              </Box>
            )}
            <Block block={block} {...entryProps} />
          </Fragment>
        );
      })}
    </Box>
  </ScrollView>
);
