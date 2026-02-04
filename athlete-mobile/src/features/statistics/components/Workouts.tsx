import { RadarChart } from "@/charts/RadarChart";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { CompleteWorkoutType } from "@/store/completedWorkoutsStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay, dateToHHMM } from "@/utils/date";
import { getTimeString, getWeightString } from "@/utils/formatters";
import { useCallback, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { useStatisticsWorkouts } from "../hooks/useStatisticsWorkouts";
import { useWorkoutsData } from "../hooks/useWorkoutsData";
import type { ScaleType } from "../models/WorkoutsData";
import { ScaleButton } from "./ScaleButton";
import { TrainingSummary } from "./TrainingSummary";

interface WorkoutsProps {
  workouts?: CompleteWorkoutType[];
  trainingPlan?: TrainingPlanType | null;
}

/**
 * Workouts Statistics Component
 * Displays workout history with radar chart, summary, and workouts list.
 */
export const Workouts: FC<WorkoutsProps> = ({
  workouts: propWorkouts,
  trainingPlan = null,
}) => {
  const hookWorkouts = useStatisticsWorkouts();
  const workouts = propWorkouts ?? hookWorkouts;
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [scale, setScale] = useState<ScaleType>("total");

  const { summaryData, userSkills, sortedWorkouts, hasWorkouts } =
    useWorkoutsData({ workouts, trainingPlan, scale });

  const renderListItem = useCallback(
    ({ item }: { item: CompleteWorkoutType }) => {
      if (
        !item.duration &&
        !item.exerciseCount &&
        !item.xpEarned &&
        !item.movedWeight
      ) {
        return null;
      }

      const date = new Date(item.timestamp);
      const formattedDate = `${formatDateForDisplay(date)} - ${dateToHHMM(date)}`;

      return (
        <Box
          flexDirection="row"
          alignItems="stretch"
          borderBottomWidth={1}
          borderColor="darkGrey1"
          testID={`workout-row-${item.id}`}
        >
          <Box width="100%" justifyContent="center" alignItems="center">
            <Text
              variant="body"
              flex={1}
              alignSelf="stretch"
              paddingHorizontal="l"
              paddingTop="s"
              style={{ color: colors.darkGrey2 }}
            >
              {formattedDate}
            </Text>
            <TrainingSummary
              duration={getTimeString(item.duration)}
              count={String(item.exerciseCount ?? 0)}
              xp={String(item.xpEarned ?? 0)}
              weight={getWeightString(item.movedWeight ?? 0)}
              testID={`workout-row-${item.id}-summary`}
            />
          </Box>
        </Box>
      );
    },
    [colors.darkGrey2],
  );

  return (
    <Box flex={1} justifyContent="flex-start" alignItems="center">
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        padding="l"
      >
        <ScaleButton
          isActive={scale === "week"}
          scale="week"
          setScale={setScale}
        />
        <ScaleButton
          isActive={scale === "month"}
          scale="month"
          setScale={setScale}
        />
        <ScaleButton
          isActive={scale === "year"}
          scale="year"
          setScale={setScale}
        />
        <ScaleButton
          isActive={scale === "total"}
          scale="total"
          setScale={setScale}
        />
      </Box>
      <Box alignSelf="stretch" alignItems="center">
        <RadarChart userSkills={userSkills} />
        <TrainingSummary
          duration={getTimeString(summaryData.duration)}
          count={String(summaryData.count)}
          xp={String(summaryData.xp)}
          weight={getWeightString(summaryData.weight)}
          testID="overall-summary"
        />
      </Box>
      {!hasWorkouts ? (
        <Box
          width="100%"
          justifyContent="center"
          alignItems="center"
          testID="no-workouts-message"
        >
          <Text variant="title" padding="l" style={{ color: colors.darkGrey2 }}>
            {t("statistics.workouts.noWorkoutYet")}
          </Text>
        </Box>
      ) : (
        <Box
          flex={1}
          alignSelf="stretch"
          justifyContent="center"
          alignItems="center"
          backgroundColor="lightGrey1"
          marginTop="m"
          testID="workouts-list-container"
        >
          <Text
            variant="title"
            flex={1}
            alignSelf="stretch"
            paddingHorizontal="l"
            paddingTop="s"
            style={{ color: colors.darkGrey3 }}
          >
            {t("statistics.workouts.recentWorkouts")}
          </Text>
          <FlatList
            // TODO: rethink screen nesting in regards to outer scrollbox in the statistics index screen
            scrollEnabled={false}
            disableVirtualization
            data={sortedWorkouts}
            renderItem={renderListItem}
            keyExtractor={(item) => item.id}
            initialNumToRender={10}
            style={{ width: "100%" }}
            testID="workouts-list"
          />
        </Box>
      )}
    </Box>
  );
};
