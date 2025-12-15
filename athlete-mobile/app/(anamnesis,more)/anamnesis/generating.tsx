import { Loading } from "@/common/Loading";
import { SpeechBubble } from "@/common/SpeechBubble";
import PlanGenerator from "@/features/training/generators/PlanGenerator";
import { Logger } from "@/services/Logger";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useExercisesStore } from "@/store/exercisesStore";
import { usePlacesStore } from "@/store/placesStore";
import { useSkillTreesStore } from "@/store/skillTreesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { Route, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, StyleSheet } from "react-native";

const TIME_PER_STAGE = 1000; // 1 second per stage

export default function Generating() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: Route }>();
  const originPath = params.originPath;

  const [stage, setStage] = useState(0);
  const [stagesEnded, setStagesEnded] = useState(false);
  const [generatingEnded, setGeneratingEnded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const {
    originPath: storedOriginPath,
    seasonPhase,
    setSeasonPhase: setAnamnesisSeasonPhase,
  } = useAnamnesisStore();
  const {
    workoutData,
    setSeasonPhase: saveSeasonPhaseToWorkoutData,
    trainingPlan,
    setTrainingPlan,
  } = useUserWorkoutStore();
  const { isInInitialAnamnesis, setIsInInitialAnamnesis, userId } =
    useUserProfileStore();
  const { exercises } = useExercisesStore();
  const { skillTrees } = useSkillTreesStore();
  const { branchData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();

  const createTrainingPlan = async () => {
    try {
      const shouldUpdateExisting =
        trainingPlan &&
        seasonPhase &&
        workoutData.seasonPhase &&
        workoutData.seasonPhase.type === seasonPhase.type;

      if (trainingPlan && !shouldUpdateExisting) {
        // TODO: Archive existing plan to Firebase
        // await userService.archiveTrainingPlan(trainingPlan);
      }

      // Save season phase to workoutData (matches legacy behavior)
      if (seasonPhase) {
        saveSeasonPhaseToWorkoutData(seasonPhase);
      }

      // Prepare data for PlanGenerator
      // Build user object matching legacy structure
      const user = {
        userId,
        workoutData: {
          ...workoutData,
          seasonPhase: seasonPhase || workoutData.seasonPhase,
        },
      };

      // Determine start date: use existing plan start or current date
      const startDate =
        shouldUpdateExisting && trainingPlan?.start
          ? new Date(trainingPlan.start)
          : new Date();

      // Generate training plan
      const plan = PlanGenerator.generatePlan(
        user,
        exercises || [],
        skillTrees,
        branchData,
        trainingDays,
        places,
        startDate,
      );

      // Save generated plan
      setTrainingPlan(plan);

      // TODO: Persist to Firebase
      // const userService = new UserService(firebaseConnector);
      // await userService.setActiveTrainingPlan(plan);

      // TODO: Setup push notifications for training reminders
      // const pushNotificationService = new PushNotificationService();
      // await pushNotificationService.checkPermissionsAndCreateNotifications(userId, plan);

      // Clean up anamnesis seasonPhase (matches legacy behavior)
      setAnamnesisSeasonPhase(null);

      setGeneratingEnded(true);
    } catch (error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      console.error("Error generating plan:", error);
      Logger.logError(error as Error);

      const origin = originPath ?? storedOriginPath;

      Alert.alert(
        t("screens.generating.errorTitle"),
        t("screens.generating.errorMessage"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              if (origin === "/more") {
                router.navigate("/more");
              } else {
                router.navigate("/(tabs)/(home)");
              }
            },
          },
        ],
      );
    }
  };

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

    // Start creating the training plan
    createTrainingPlan();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    // we only want this effect to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const goOn = () => {
      Logger.logEvent("anamnesis_create_training_plan_completed");
      if (isInInitialAnamnesis) {
        setIsInInitialAnamnesis(false);
      }
      router.replace("/(tabs)/(home)");
    };

    // When both stages and generation are complete, navigate away
    if (stagesEnded && generatingEnded) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      goOn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagesEnded, generatingEnded]);

  const getStageText = () => {
    switch (stage) {
      case 0:
        return t("screens.generating.stage1");
      case 1:
        return t("screens.generating.stage2");
      case 2:
        return t("screens.generating.stage3");
      case 3:
        return t("screens.generating.stage4");
      default:
        return t("screens.generating.stage1");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.generating.title"),
          headerShown: false,
        }}
      />
      <Box flex={1} backgroundColor="lightGrey1" padding="m">
        <Box flex={1} justifyContent="center" alignItems="center">
          <SpeechBubble text={t("screens.generating.thanksMessage")} centered />

          <Image
            style={styles.coach}
            source={require("../../../assets/img/coach/face.png")}
            resizeMode="contain"
            accessibilityLabel={t("screens.welcome.coachImageAlt")}
          />

          <Text variant="body" marginTop="m" textAlign="center">
            {getStageText()}
          </Text>
        </Box>

        <Loading show text={t("common.generatingTrainingPlan")} />
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  coach: {
    width: 80,
    height: 80,
    marginTop: 20,
  },
});
