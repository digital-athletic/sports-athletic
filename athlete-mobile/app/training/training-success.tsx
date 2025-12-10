import { PowerTest } from "@/charts/PowerTest";
import { RadarChart } from "@/charts/RadarChart";
import { Loading } from "@/common/Loading";
import { TrainingSummary } from "@/features/statistics/components/TrainingSummary";
import { type UserSkills } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

type WorkoutTotals = {
  duration: number;
  count: number;
  points: number;
  weight: number;
  height: number;
};

/**
 * Training Success Screen
 *
 * Displays training completion summary with:
 * - Radar chart showing skill distribution
 * - Training summary (duration, exercises, points, weight)
 * - Special handling for test workouts (power test results)
 *
 * Back gestures disabled to ensure controlled flow.
 * Legacy: views/training/TrainingSuccess
 */
const TrainingSuccessScreen: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTestWorkout, setIsTestWorkout] = useState(false);
  const [skills, setSkills] = useState<UserSkills>({
    PREVENTION: 0,
    MOBILITY: 0,
    SWR: 0,
    WARMUP: 0,
    STABILITY: 0,
    CARDIO: 0,
  });
  const [totals, setTotals] = useState<WorkoutTotals>({
    duration: 0,
    count: 0,
    points: 0,
    weight: 0,
    height: 0,
  });

  useEffect(() => {
    // TODO: Fetch completed workout data from store/API
    // TODO: Calculate XP and add to user progress
    // TODO: Check if review prompt should be shown
    // TODO: Determine if this is a test workout
    // TODO: Calculate skill counts from workout data

    // Placeholder: simulate loading
    const timer = setTimeout(() => {
      // Mock data for demonstration
      setSkills({
        PREVENTION: 15,
        MOBILITY: 10,
        SWR: 25,
        WARMUP: 5,
        STABILITY: 20,
        CARDIO: 15,
      });
      setTotals({
        duration: 1200, // 20 minutes in seconds
        count: 12,
        points: 85,
        weight: 450, // kg
        height: 0,
      });
      setIsTestWorkout(false);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0
      ? `${mins}:${secs.toString().padStart(2, "0")} min`
      : `${mins} min`;
  };

  const formatWeight = (kg: number): string => {
    return `${Math.round(kg)} kg`;
  };

  const handleGoOn = () => {
    // TODO: Reset training state
    router.replace("/(tabs)/(home)");
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t("training.success.title") }} />
        <Box flex={1} justifyContent="center" alignItems="center">
          <Loading show={true} text={t("training.success.calculating")} />
        </Box>
      </>
    );
  }

  const hasWorkoutData = totals.count > 0;

  return (
    <>
      <Stack.Screen options={{ title: t("training.success.title") }} />
      <Box flex={1} backgroundColor="white">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {isTestWorkout ? (
            <Box flex={1} padding="m">
              <PowerTest isSuccessScreen={true} />
            </Box>
          ) : hasWorkoutData ? (
            <Box flex={1}>
              <Box
                flex={2}
                padding="l"
                justifyContent="center"
                alignItems="center"
              >
                <RadarChart adjustScales={true} userSkills={skills} />
              </Box>
              <Box
                flex={1}
                padding="l"
                borderTopWidth={2}
                borderTopColor="lightGrey2"
                backgroundColor="lightGrey1"
              >
                <TrainingSummary
                  duration={formatDuration(totals.duration)}
                  count={totals.count.toString()}
                  points={totals.points.toString()}
                  weight={formatWeight(totals.weight)}
                />
              </Box>
            </Box>
          ) : (
            <Box flex={1} padding="l" justifyContent="center">
              <Text variant="body" textAlign="center">
                {t("training.success.dataMissing")}
              </Text>
            </Box>
          )}
        </ScrollView>

        <Box padding="l">
          <Button variant="primary" onPress={handleGoOn}>
            {t("training.success.goOn")}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default TrainingSuccessScreen;
