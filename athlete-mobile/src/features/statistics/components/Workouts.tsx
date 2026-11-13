import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { formatDateForDisplay, dateToHHMM } from "@/utils/date";
import { getTimeString, getWeightString } from "@/utils/formatters";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { useStatisticsWorkouts } from "../hooks/useStatisticsWorkouts";
import { useWorkoutsData } from "../hooks/useWorkoutsData";
import type { ScaleType } from "../models/WorkoutsData";
import { RadarChartCard } from "./RadarChartCard";
import { TrainingSummary } from "./TrainingSummary";

interface WorkoutsProps {
  scale: ScaleType;
  workouts?: CompleteWorkoutType[];
  trainingPlan?: TrainingPlanType | null;
}

const SEPARATOR = " · ";

const hasValues = (workout: CompleteWorkoutType): boolean =>
  Boolean(
    workout.duration ||
      workout.exerciseCount ||
      workout.xpEarned ||
      workout.movedWeight,
  );

/** One recent workout: date and time as title, all values in one line. */
const WorkoutCard: FC<{ workout: CompleteWorkoutType }> = ({ workout }) => {
  const { t } = useTranslation();
  const date = new Date(workout.timestamp);
  const testID = `workout-row-${workout.id}`;
  const title = t("statistics.workouts.workoutTitle", {
    date: formatDateForDisplay(date),
    time: dateToHHMM(date),
  });
  const values = [
    ["duration", getTimeString(workout.duration)],
    [
      "count",
      t("statistics.workouts.workoutLine.exercises", {
        count: workout.exerciseCount ?? 0,
      }),
    ],
    [
      "xp",
      t("statistics.workouts.workoutLine.points", {
        count: workout.xpEarned ?? 0,
      }),
    ],
    ["weight", getWeightString(workout.movedWeight ?? 0)],
  ] as const;

  return (
    <Card
      variant="outlined"
      paddingHorizontal="m"
      paddingVertical="s"
      gap="xs"
      accessible
      accessibilityLabel={`${title}, ${values.map(([, value]) => value).join(", ")}`}
      testID={testID}
    >
      <Text variant="body" fontWeight="600" testID={`${testID}-title`}>
        {title}
      </Text>
      <Text
        variant="small"
        color="onSurfaceVariant"
        numberOfLines={1}
        adjustsFontSizeToFit
        testID={`${testID}-summary`}
      >
        {values.map(([type, value], index) => (
          <Text key={type}>
            {index > 0 && SEPARATOR}
            <Text testID={`${testID}-summary-${type}`}>{value}</Text>
          </Text>
        ))}
      </Text>
    </Card>
  );
};

/**
 * Workouts Statistics Component
 * Displays the radar chart, the summary cards and one card per recent workout.
 */
export const Workouts: FC<WorkoutsProps> = ({
  scale,
  workouts: propWorkouts,
  trainingPlan = null,
}) => {
  const hookWorkouts = useStatisticsWorkouts();
  const workouts = propWorkouts ?? hookWorkouts;
  const { t } = useTranslation();

  const { summaryData, userSkills, sortedWorkouts, hasWorkouts } =
    useWorkoutsData({ workouts, trainingPlan, scale });

  return (
    <Box paddingHorizontal="m" paddingBottom="l" gap="m">
      <RadarChartCard userSkills={userSkills} />
      <TrainingSummary
        duration={getTimeString(summaryData.duration)}
        count={String(summaryData.count)}
        xp={String(summaryData.xp)}
        weight={getWeightString(summaryData.weight)}
        testID="overall-summary"
      />
      {!hasWorkouts ? (
        <Box alignItems="center" testID="no-workouts-message">
          <Text variant="title" padding="l" color="onSurfaceVariant">
            {t("statistics.workouts.noWorkoutYet")}
          </Text>
        </Box>
      ) : (
        <Box gap="s" testID="workouts-list-container">
          <Text variant="sectionLabel" accessibilityRole="header" marginTop="s">
            {t("statistics.workouts.recentWorkouts")}
          </Text>
          <Box gap="s" testID="workouts-list">
            {sortedWorkouts.filter(hasValues).map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
