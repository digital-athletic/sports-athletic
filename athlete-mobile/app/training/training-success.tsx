import { RadarChart } from "@/charts/RadarChart";
import { SUPPORT_EMAIL } from "@/constants/AppConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import { PowerTest } from "@/features/statistics/components/PowerTest";
import { TrainingSummary } from "@/features/statistics/components/TrainingSummary";
import { seconds } from "@/features/training/models/TimeUnits";
import { useTrainingStore } from "@/features/training/trainingStore";
import { calculateSkillsFromTime } from "@/features/training/utils/trainingSuccessUtils";
import { calculateWorkoutTotals } from "@/features/training/utils/workoutUtils";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { getTimeString, getWeightString } from "@/utils/formatters";
import { parseBooleanParam } from "@/utils/router";
import { supportMessage } from "@/utils/supportMessage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, type FC } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Training Success Screen
 *
 * Displays training completion summary. Aborted sessions skip XP and history.
 * Back gestures disabled to ensure controlled flow.
 * Legacy: views/training/TrainingSuccess
 */
const TrainingSuccessScreen: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ aborted?: string }>();
  const aborted = parseBooleanParam(params.aborted);
  const { exerciseList, time, activeTraining, clearTraining } =
    useTrainingStore();
  const exercises = getAllExercises();
  const { workoutData } = useUserWorkoutStore();
  const maxValues = workoutData.maxValues;
  const { addXP } = useExerciseProgressStore();
  const { addCompletedWorkout } = useCompletedWorkoutsStore();
  const xpAwarded = useRef(false);
  const workoutSaved = useRef(false);
  const insets = useSafeAreaInsets();

  // Detect test workout by checking if any exercise has repetition === -1
  // This matches legacy behavior which is more reliable than checking activeTraining.type
  const isTestWorkout =
    activeTraining?.type === "TEST_WORKOUT" ||
    exerciseList?.some((e) => e.repetition === -1) === true;

  const skills = useMemo(
    () => calculateSkillsFromTime(time.skill),
    [time.skill],
  );

  const totals = useMemo(
    () =>
      calculateWorkoutTotals(time, exerciseList ?? [], exercises, maxValues),
    [time, exerciseList, exercises, maxValues],
  );

  // Award XP when workout is completed (only once, skip aborted sessions)
  useEffect(() => {
    if (!aborted && !xpAwarded.current && totals.xp > 0) {
      addXP(totals.xp);
      xpAwarded.current = true;
    }
  }, [aborted, totals.xp, addXP]);

  // Save completed workout to history (only once, skip aborted and test workouts)
  useEffect(() => {
    if (
      !aborted &&
      !workoutSaved.current &&
      totals.count > 0 &&
      !isTestWorkout &&
      exerciseList
    ) {
      addCompletedWorkout({
        id: activeTraining?.id ?? `workout-${Date.now()}`,
        timestamp: Date.now(),
        exercises: exerciseList,
        duration: seconds(totals.duration),
        xpEarned: totals.xp,
        movedWeight: totals.weight,
        exerciseCount: totals.count,
        userSkills: skills,
      });
      workoutSaved.current = true;
    }
  }, [
    aborted,
    totals,
    skills,
    exerciseList,
    isTestWorkout,
    addCompletedWorkout,
    activeTraining?.id,
  ]);

  const handleGoOn = () => {
    clearTraining();
    router.replace("/(tabs)/(home)");
  };

  const hasWorkoutData = totals.count > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("training.success.title"),
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
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
                <RadarChart userSkills={skills} />
              </Box>
              <Box
                flex={1}
                padding="l"
                borderTopWidth={2}
                borderTopColor="lightGrey2"
                backgroundColor="lightGrey1"
              >
                <TrainingSummary
                  duration={getTimeString(totals.duration)}
                  count={totals.count.toString()}
                  xp={totals.xp.toString()}
                  weight={getWeightString(totals.weight)}
                />
              </Box>
            </Box>
          ) : (
            <Box flex={1} padding="l" justifyContent="center">
              <Text variant="body" textAlign="center">
                {supportMessage(
                  t,
                  "training.success.dataMissing",
                  SUPPORT_EMAIL,
                )}
              </Text>
            </Box>
          )}
        </ScrollView>

        <Box padding="l">
          <Button
            variant="primary"
            onPress={handleGoOn}
            style={{ marginBottom: insets.bottom }}
          >
            {t("training.success.goOn")}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default TrainingSuccessScreen;
