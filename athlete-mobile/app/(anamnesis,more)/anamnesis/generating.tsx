import { Alert } from "@/common/Alert";
import { useAnnounce } from "@/common/announce";
import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { GeneratingStages } from "@/features/anamnesis/components/GeneratingStages";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { generatePlan } from "@/features/training/planGeneratorRouter";
import { keepUnchangedTrainingDays } from "@/features/training/utils/planRegeneration";
import {
  type PlanStartInput,
  planStartDateFor,
  preservesPlanStart,
} from "@/features/training/utils/planStartDate";
import { Logger } from "@/services/Logger";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { RoutePath, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet } from "react-native";

const TIME_PER_STAGE = 1000; // 1 second per stage

export default function Generating() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;

  const [stage, setStage] = useState(0);
  const [stagesEnded, setStagesEnded] = useState(false);
  const [generatingEnded, setGeneratingEnded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const { seasonPhase, setSeasonPhase: setAnamnesisSeasonPhase } =
    useAnamnesisStore();
  const {
    workoutData,
    setSeasonPhase: saveSeasonPhaseToWorkoutData,
    trainingPlan,
    setTrainingPlan,
  } = useUserWorkoutStore();
  const { anamnesisCompleted, setAnamnesisCompleted, personalData } =
    useUserProfileStore();
  const { auth } = useAuthStore();
  const userId = auth?.userId;
  const exercises = getAllExercises();
  const skillTrees = getAllSkillTrees();
  const { branchData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { workoutsList } = useCompletedWorkoutsStore();

  const startInputFor = (sameSeasonPhase: boolean): PlanStartInput => ({
    trainingPlan: trainingPlan ?? undefined,
    sameSeasonPhase,
    workoutTimestamps: workoutsList.map((workout) => workout.timestamp),
    today: new Date(),
  });

  // a regeneration with the preserved start keeps the unaffected training days
  const savePlan = (plan: TrainingPlanType, startInput: PlanStartInput) =>
    setTrainingPlan(
      trainingPlan && preservesPlanStart(startInput)
        ? keepUnchangedTrainingDays(trainingPlan, plan)
        : plan,
    );

  const failPlanGeneration = (error: unknown) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    console.error("Error generating plan:", error);
    Logger.logError(error as Error);

    Alert.alert(
      t("screens.generating.errorTitle"),
      t("screens.generating.errorMessage"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            if (originPath === "/more") {
              router.navigate("/more");
            } else {
              router.navigate("/(tabs)/(home)");
            }
          },
        },
      ],
    );
    return false;
  };

  const createTrainingPlan = async (): Promise<boolean> => {
    // Guards and conditions stay outside the try: the React Compiler skips a
    // try block that contains a throw or a conditional expression.
    if (!seasonPhase) {
      return failPlanGeneration(
        new Error("seasonPhase is required for plan generation"),
      );
    }
    if (!userId) {
      return failPlanGeneration(
        new Error("userId is required for plan generation"),
      );
    }

    const shouldUpdateExisting = Boolean(
      trainingPlan &&
        workoutData.seasonPhase &&
        workoutData.seasonPhase.type === seasonPhase.type,
    );

    if (trainingPlan && !shouldUpdateExisting) {
      // TODO: Archive the existing plan on the backend before replacing it
    }

    try {
      const startInput = startInputFor(shouldUpdateExisting);
      const startDate = planStartDateFor(startInput);

      // Save season phase to workoutData (calculates numOfWeeks with startDate)
      saveSeasonPhaseToWorkoutData(seasonPhase, startDate);

      // Get fresh workoutData from store (not stale closure data)
      const freshWorkoutData = useUserWorkoutStore.getState().workoutData;

      // Prepare data for PlanGenerator
      // Build user object matching legacy structure
      const user = {
        userId,
        personalData,
        workoutData: {
          ...freshWorkoutData,
          seasonPhase: freshWorkoutData.seasonPhase,
        },
      };

      // Generate training plan
      const plan = generatePlan({
        user,
        exercises,
        skillTrees,
        branchData,
        trainingDays,
        places,
        startDate,
      });

      savePlan(plan, startInput);

      // TODO: Persist the active plan to the backend

      // TODO: Setup push notifications for training reminders
      // const pushNotificationService = new PushNotificationService();
      // await pushNotificationService.checkPermissionsAndCreateNotifications(userId, plan);

      // Clean up anamnesis seasonPhase (matches legacy behavior)
      setAnamnesisSeasonPhase(null);

      return true;
    } catch (error) {
      return failPlanGeneration(error);
    }
  };

  const startCreatingTrainingPlan = useEffectEvent(() => {
    createTrainingPlan().then((succeeded) => {
      if (succeeded) setGeneratingEnded(true);
    });
  });

  const finishGenerating = useEffectEvent(() => {
    Logger.logEvent("anamnesis_create_training_plan_completed");
    if (!anamnesisCompleted) {
      setAnamnesisCompleted(true);
    }
    // Dismiss all anamnesis screens from the stack before navigating to home
    // This prevents them from remaining in memory and causing navigation issues
    router.dismissAll();
    router.replace("/(tabs)/(home)");
  });

  useEffect(() => {
    Logger.logEvent("anamnesis_create_training_plan_start");

    // Start the stage animation
    intervalRef.current = setInterval(() => {
      setStage((prev) => {
        if (prev < 3) {
          return prev + 1;
        } else {
          setStagesEnded(true);
          return prev;
        }
      });
    }, TIME_PER_STAGE);

    startCreatingTrainingPlan();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // When both stages and generation are complete, navigate away
    if (stagesEnded && generatingEnded) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      finishGenerating();
    }
  }, [stagesEnded, generatingEnded]);

  const stages = [
    t("screens.generating.stage1"),
    t("screens.generating.stage2"),
    t("screens.generating.stage3"),
    t("screens.generating.stage4"),
  ];

  useAnnounce(stages[stage]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.generating.title"),
          headerShown: false,
        }}
      />
      <Box
        flex={1}
        backgroundColor="white"
        padding="l"
        justifyContent="center"
        alignItems="center"
        gap="xl"
      >
        <Box alignItems="center" gap="m">
          <Box
            width={104}
            height={104}
            borderRadius="round"
            backgroundColor="primaryTint"
            justifyContent="center"
            alignItems="center"
          >
            <Image
              style={styles.coach}
              source={require("../../../assets/img/coach/face.png")}
              resizeMode="contain"
              accessibilityLabel={t("screens.welcome.coachImageAlt")}
            />
          </Box>
          <Text variant="eyebrow" color="primary">
            {t("common.generatingTrainingPlan")}
          </Text>
          <Text
            variant="display"
            fontSize={24}
            lineHeight={30}
            textAlign="center"
          >
            {t("screens.generating.thanksMessage")}
          </Text>
        </Box>
        <GeneratingStages stages={stages} activeIndex={stage} />
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  coach: {
    width: 76,
    height: 76,
  },
});
