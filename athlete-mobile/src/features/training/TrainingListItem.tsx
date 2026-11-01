import { Ionicon } from "@/common/Ionicon";
import { type ChecklistSetSummary } from "@/features/training/hooks/useTrainingListRows";
import { type DifficultyFeedbackType } from "@/schemas/generator.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { Fragment, type FC } from "react";
import { useTranslation } from "react-i18next";
import { TrainingListItemActions } from "./TrainingListItemActions";

export type TrainingListItemProps = {
  displayName: string;
  sets: ChecklistSetSummary[];
  /** True for the entry of a superset whose set comes next. */
  isNext: boolean;
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

/** The main value of each set, e.g. "✓ 20 kg / 35 kg / 40 kg" after one set. */
const SetSummary: FC<{ sets: ChecklistSetSummary[]; testId: string }> = ({
  sets,
  testId,
}) => {
  const labelledSets = sets.filter((set) => set.label !== undefined);
  if (labelledSets.length === 0) return null;

  return (
    <Text variant="small" color="darkGrey1">
      {labelledSets.map((set, position) => (
        <Fragment key={set.index}>
          {position > 0 && " / "}
          <Text
            variant="small"
            color={set.completed ? "successText" : "darkGrey1"}
            fontWeight={set.completed ? "600" : "400"}
            accessibilityState={{ checked: set.completed }}
            testID={`${testId}-set-${set.index}`}
          >
            {set.completed ? `✓ ${set.label}` : set.label}
          </Text>
        </Fragment>
      ))}
    </Text>
  );
};

const NextArrow: FC<{ testId: string }> = ({ testId }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Box
      marginRight="s"
      accessible
      accessibilityLabel={t("training.list.a11y.nextExercise")}
      testID={`${testId}-next-arrow`}
    >
      <Ionicon
        name="arrow-forward"
        size={20}
        color={colors.primary}
        decorative
      />
    </Box>
  );
};

/**
 * One exercise in the list-view training checklist: its name, the main value
 * of each set, and a start control. Start opens the TrainingExerciseSheet on
 * the first open set of the exercise.
 */
export const TrainingListItem: FC<TrainingListItemProps> = ({
  displayName,
  sets,
  isNext,
  isTest,
  isCompleted,
  completedFeedback,
  repsValue,
  onStart,
  onShowInfo,
  testId,
}) => (
  <Box
    testID={testId}
    borderBottomWidth={1}
    borderBottomColor="lightGrey2"
    paddingVertical="m"
  >
    <Box flexDirection="row" alignItems="center">
      {isNext && <NextArrow testId={testId} />}
      <TouchableBox flex={1} onPress={onShowInfo}>
        <Box opacity={isCompleted ? 0.5 : 1}>
          <Text variant="body">{displayName}</Text>
          <SetSummary sets={sets} testId={testId} />
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
