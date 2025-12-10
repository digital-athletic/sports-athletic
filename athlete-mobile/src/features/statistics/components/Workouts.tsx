import { RadarChart } from "@/charts/RadarChart";
import { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { dateToDDMMYYYY, dateToHHMM } from "@/utils/date";
import { getTimeString, getWeightString } from "@/utils/formatters";
import { useCallback, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { useWorkoutsData } from "../hooks/useWorkoutsData";
import { ScaleType, WorkoutsListEntry } from "../models/WorkoutsData";
import { ScaleButton } from "./ScaleButton";
import { TrainingSummary } from "./TrainingSummary";

interface WorkoutsProps {
  workoutsList?: WorkoutsListEntry[];
  trainingPlan?: TrainingPlanType | null;
}

const DUMMY_WORKOUTS_LIST: WorkoutsListEntry[] = [
  {
    workoutId: "1",
    date: Date.now() - 10000000,
    duration: 3600,
    exerciseCount: 10,
    points: 100,
    movedWeight: 5000,
    userSkills: {
      PREVENTION: 10,
      MOBILITY: 20,
      SWR: 15,
      WARMUP: 5,
      STABILITY: 8,
      CARDIO: 12,
    },
  },
  {
    workoutId: "2",
    date: Date.now() - 50000000,
    duration: 4500,
    exerciseCount: 12,
    points: 120,
    movedWeight: 6000,
    userSkills: {
      PREVENTION: 12,
      MOBILITY: 18,
      SWR: 20,
      WARMUP: 7,
      STABILITY: 10,
      CARDIO: 15,
    },
  },
];

/**
 * Workouts Statistics Component
 * Displays workout history with radar chart, summary, and workouts list.
 */
export const Workouts: FC<WorkoutsProps> = ({
  workoutsList = DUMMY_WORKOUTS_LIST,
  trainingPlan = null,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [scale, setScale] = useState<ScaleType>("total");

  const { summaryData, userSkills, sortedWorkouts, hasWorkouts } =
    useWorkoutsData({ workoutsList, trainingPlan, scale });

  const renderListItem = useCallback(
    ({ item }: { item: WorkoutsListEntry }) => {
      if (
        !item.duration &&
        !item.exerciseCount &&
        !item.points &&
        !item.movedWeight
      ) {
        return null;
      }

      const isTestWorkout = item.points === 0;

      const date = new Date(item.date);
      const formattedDate = `${dateToDDMMYYYY(date)} - ${dateToHHMM(date)}`;

      return (
        <Box
          flexDirection="row"
          alignItems="stretch"
          borderBottomWidth={1}
          borderColor="darkGrey1"
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
            {isTestWorkout ? (
              <Text
                variant="title"
                flex={1}
                alignSelf="stretch"
                paddingHorizontal="l"
                paddingVertical="s"
                style={{ color: colors.darkGrey2 }}
              >
                {t("statistics.workouts.testWorkout")}
              </Text>
            ) : (
              <TrainingSummary
                duration={getTimeString(item.duration)}
                count={String(item.exerciseCount)}
                points={String(item.points)}
                weight={getWeightString(item.movedWeight)}
              />
            )}
          </Box>
        </Box>
      );
    },
    [colors.darkGrey2, t],
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
      <Box
        flex={1}
        alignSelf="stretch"
        justifyContent="center"
        alignItems="center"
      >
        <RadarChart adjustScales userSkills={userSkills} />
        <TrainingSummary
          duration={getTimeString(summaryData.duration)}
          count={String(summaryData.count)}
          points={String(summaryData.points)}
          weight={getWeightString(summaryData.weight)}
        />
      </Box>
      {!hasWorkouts ? (
        <Box width="100%" justifyContent="center" alignItems="center">
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
            keyExtractor={(item) => item.workoutId}
            initialNumToRender={10}
            style={{ width: "100%" }}
          />
        </Box>
      )}
    </Box>
  );
};
