import {
  type ChecklistSetSummary,
  type ValueKind,
} from "@/features/training/hooks/useTrainingListRows";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { Fragment, type FC } from "react";
import { useTranslation } from "react-i18next";
import { ExerciseThumbnail } from "./ExerciseThumbnail";
import { TrainingListItemActions } from "./TrainingListItemActions";

export type TrainingListItemProps = {
  displayName: string;
  pictureUrl: string | null;
  valueKind: ValueKind | null;
  sets: ChecklistSetSummary[];
  /** True for the one exercise whose start button is filled. */
  isFeatured: boolean;
  isTest: boolean;
  isCompleted: boolean;
  skippedCount: number;
  /** Which feedback (if any) was chosen when this row was completed. */
  completedFeedback?: DifficultyFeedbackType | null;
  repsValue: number;
  resumeSeconds?: number;
  onStart: () => void;
  onRetake: () => void;
  onShowInfo: () => void;
  /** Base identifier for this row, used to derive per-control testIDs (e2e). */
  testId: string;
};

/** The main value of each set, e.g. "✓ 20 kg / 35 kg / 40 kg" after one set. */
const SetSummary: FC<{ sets: ChecklistSetSummary[]; testId: string }> = ({
  sets,
  testId,
}) => {
  const labelledSets = sets.filter((set) => set.label !== undefined);
  if (labelledSets.length === 0) return null;

  return (
    <Text variant="small" color="onSurfaceVariant">
      {labelledSets.map((set, position) => {
        const isDone = set.completed && !set.skipped;
        return (
          <Fragment key={set.index}>
            {position > 0 && " / "}
            <Text
              variant="small"
              color={isDone ? "onSuccessContainer" : "onSurfaceVariant"}
              fontWeight={isDone ? "600" : "400"}
              accessibilityState={{ checked: isDone }}
              testID={`${testId}-set-${set.index}`}
            >
              {isDone ? `✓ ${set.label}` : set.label}
            </Text>
          </Fragment>
        );
      })}
    </Text>
  );
};

/** "Skipped" when every set was skipped, else e.g. "2 of 3 skipped". */
const SkippedNote: FC<{
  skippedCount: number;
  setCount: number;
  testId: string;
}> = ({ skippedCount, setCount, testId }) => {
  const { t } = useTranslation();
  if (skippedCount === 0) return null;

  return (
    <Text
      variant="small"
      color="onSurfaceVariant"
      testID={`${testId}-skipped-label`}
    >
      {skippedCount === setCount
        ? t("training.list.skipped")
        : t("training.list.skippedOfSets", {
            count: skippedCount,
            total: setCount,
          })}
    </Text>
  );
};

const EntryDetails: FC<{
  displayName: string;
  sets: ChecklistSetSummary[];
  skippedCount: number;
  testId: string;
}> = ({ displayName, sets, skippedCount, testId }) => (
  <>
    <Text variant="body" testID={`${testId}-name`}>
      {displayName}
    </Text>
    <SetSummary sets={sets} testId={testId} />
    <SkippedNote
      skippedCount={skippedCount}
      setCount={sets.length}
      testId={testId}
    />
  </>
);

/**
 * One exercise in the list-view training checklist: its name, the main value
 * of each set, and a start control. Start opens the TrainingExerciseSheet on
 * the first open set of the exercise.
 */
export const TrainingListItem: FC<TrainingListItemProps> = ({
  displayName,
  pictureUrl,
  valueKind,
  sets,
  isCompleted,
  skippedCount,
  onShowInfo,
  testId,
  ...actionProps
}) => {
  const dimOpacity = isCompleted ? 0.5 : 1;

  return (
    <Box
      testID={testId}
      borderBottomWidth={1}
      borderBottomColor="outlineVariant"
      paddingVertical="m"
    >
      <Box flexDirection="row" alignItems="center" gap="s">
        <TouchableBox
          flex={1}
          flexDirection="row"
          alignItems="center"
          gap="s"
          onPress={onShowInfo}
        >
          <Box opacity={dimOpacity}>
            <ExerciseThumbnail
              pictureUrl={pictureUrl}
              valueKind={valueKind}
              size={48}
              testID={`${testId}-picture`}
            />
          </Box>
          <Box flex={1} opacity={dimOpacity}>
            <EntryDetails
              displayName={displayName}
              sets={sets}
              skippedCount={skippedCount}
              testId={testId}
            />
          </Box>
        </TouchableBox>

        <TrainingListItemActions
          {...actionProps}
          isCompleted={isCompleted}
          skippedCount={skippedCount}
          testId={testId}
        />
      </Box>
    </Box>
  );
};
