import { BackHeader } from "@/common/BackHeader";
import { FullScreenCoaching } from "@/common/FullScreenCoaching";
import { Hint } from "@/common/Hint";
import {
  isSkillTypes,
  TileData,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { isAllowedForTraining } from "@/features/subscription/subscriptionHelpers";
import { useSubscriptionStore } from "@/features/subscription/subscriptionStore";
import { ColumnList } from "@/features/training/ColumnList";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { Logger } from "@/services/Logger";
import { useExercisesStore } from "@/store/exercisesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { DDMMYYYYToDate } from "@/utils/date";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";

type ScreenState = "SELECT" | "TEST";

/**
 * Select Training Screen
 *
 * Initial screen where users choose their training session.
 * Displays training tiles based on selection type (PLAN/PREV/QUICK).
 * Checks for power test requirements and shows coaching screen if needed.
 *
 * Legacy: views/training/SelectTraining
 */
export default function SelectTraining() {
  const { t } = useTranslation();

  const { selection, setTrainingSelection } = useTrainingStore();
  const { workoutData, trainingPlan } = useUserWorkoutStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { exercises } = useExercisesStore();
  const { subscription } = useSubscriptionStore();

  const [screenState, setScreenState] = useState<ScreenState>("SELECT");
  const [tiles, setTiles] = useState<TileData[]>([]);

  // Back handler
  const handleBack = useCallback(() => {
    setTrainingSelection(null);
    router.replace("/(tabs)/(home)");
    return true;
  }, [setTrainingSelection]);

  // Setup hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBack,
    );
    return () => handler.remove();
  }, [handleBack]);

  // Title based on screen state
  const title = t(
    screenState === "TEST"
      ? "training.powerTest.title"
      : "training.selectTraining.title",
  );

  const getTrainingDays = useCallback((): TileData[] => {
    if (!workoutData || !selection || selection !== "PLAN" || !trainingPlan) {
      return [];
    }

    const userTrainingDays = trainingDays.filter((day) => day.active);
    const sections = trainingPlan.sections;
    const section = getSectionForDate(sections, Date.now());

    // Find section index
    const sectionIndex = sections.findIndex((s) => s.start === section.start);
    const sectionTrainings = section.trainings;

    // check if power test is needed
    const lastTestDate = DDMMYYYYToDate(workoutData.maxValues.testDate);
    const lastTestExpired =
      lastTestDate.getTime() +
        WorkoutConstants.MAX_VALUES_EXPIRATION_TIME_IN_MS <
      Date.now();
    // look if exercises with Fmax used
    let needsFmaxValues = false;
    if (lastTestExpired) {
      const exerciseIds = sectionTrainings.reduce<number[]>(
        (acc, trainingDay) => {
          let dayExerciseIds = Object.keys(trainingDay.skills).reduce<number[]>(
            (acc2, skill) => {
              if (!isSkillTypes(skill)) {
                return acc2;
              }

              let additionalIds = [];
              for (let branch of trainingDay.skills[skill] ?? []) {
                for (let level in branch.exercises) {
                  let exerciseId = branch.exercises[level].exerciseId;
                  if (
                    exerciseId &&
                    acc2.indexOf(exerciseId) === -1 &&
                    additionalIds.indexOf(exerciseId) === -1
                  ) {
                    additionalIds.push(exerciseId);
                  }
                }
              }
              return acc2.concat(additionalIds);
            },
            [],
          );
          return acc.concat(dayExerciseIds);
        },
        [],
      );

      for (let id of exerciseIds) {
        const exercise = exercises?.find((ed) => ed.id === id);

        if (
          exercise?.values.weight.startValue.type?.type === "weightFMax" ||
          exercise?.values.weight.targetValue.type?.type === "weightFMax"
        ) {
          needsFmaxValues = true;
          break;
        }
      }
    }

    if (lastTestExpired && needsFmaxValues) {
      Logger.logEvent("test_coaching_opened");
      setScreenState("TEST");
    }

    const tiles: TileData[] = [];

    for (const userTrainingDay of userTrainingDays) {
      const sectionTraining = sectionTrainings.find(
        (training) => training.weekday === userTrainingDay.weekday,
      );

      if (sectionTraining) {
        const trainingFocus = sectionTraining.focus;

        const tile: TileData = {
          picture: WorkoutConstants.TRAINING_FOCUS_IMAGES[trainingFocus],
          title: `training.focus.${trainingFocus}`,
          description: {
            text: "training.selectTraining.timeAndPlace",
            params: {
              time: userTrainingDay.duration,
              place: t(`training.place.${userTrainingDay.place}`),
              focus: t(`training.focus.${sectionTraining.focus}`),
            },
          },
          navigate: {
            key: "/training/muscle-soreness",
            params: {
              type: "PLAN",
              weekday: userTrainingDay.weekday,
              sectionIndex,
              origin: "SelectTraining",
              sectionType: section.type,
              sectionCardioType: section.cardioType,
              trainingFocus,
            },
          },
        };

        tiles.push(tile);
      } else {
        Logger.logEvent("training_days_and_plan_trainings_not_matching", {
          userTrainingDays: userTrainingDays,
          planSectionTrainings: sectionTrainings,
        });
      }
    }

    return tiles;
  }, [workoutData, selection, trainingPlan, trainingDays, exercises, t]);

  // Initialize tile data
  useEffect(() => {
    if (!selection) return;
    let tiles: TileData[] = [];

    switch (selection) {
      case "PLAN":
        tiles = getTrainingDays();
        break;
      case "PREV":
        tiles = WorkoutConstants.PREVENTION_TILES;
        break;
      case "QUICK":
        tiles = WorkoutConstants.QUICKSTART_TILES;
        break;
      default:
        // probably just passing through when entering TrainingStack
        break;
    }

    setTiles(tiles);
  }, [getTrainingDays, selection]);

  const startPowerTest = useCallback(() => {
    // check if still subscribed
    if (isAllowedForTraining(subscription)) {
      setTrainingSelection(null);
      Logger.logEvent("test_coaching_selected_start");
      router.push({
        pathname: "/training/muscle-soreness",
        params: { type: "TEST_WORKOUT", origin: "SelectTraining" },
      });
    } else {
      // no longer in test and not subscribed
      Alert.alert(
        t("subscription.expired"),
        t("subscription.chooseSubscriptionToStart"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              router.navigate({
                pathname: "/(tabs)/(more)/subscribe",
                params: { backPath: "SelectTraining" },
              });
            },
          },
        ],
      );
    }
  }, [setTrainingSelection, subscription, t]);

  const skipPowerTest = useCallback(() => {
    Logger.logEvent("test_coaching_selected_skip");
    setScreenState("SELECT");
  }, []);

  const renderTrainingAdvice = useCallback(() => {
    let message: string = t("training.selectTraining.workoutNowMsg");

    switch (selection) {
      case "PLAN":
        message = t("training.selectTraining.workoutNowSpeedMsg");
        break;
      case "PREV":
      case "QUICK":
      default:
        message = t("training.selectTraining.workoutNowMsg");
        break;
    }

    return <Hint type="HINT" message={message} />;
  }, [selection, t]);

  const renderTiles = useCallback(() => {
    let listItems = tiles;
    if (selection === "PREV") {
      const sequence = [
        "PREVENTION_TILE_SHOULDER",
        "PREVENTION_TILE_SPINE",
        "PREVENTION_TILE_WRIST",
        "PREVENTION_TILE_KNEE",
        "PREVENTION_TILE_ANKLE",
      ];
      listItems = sequence
        .map((key) => listItems.find((item) => item.title.includes(key)))
        .filter((item) => !!item);
    }

    return (
      <Box marginBottom="s" flex={1}>
        <ColumnList
          isSubscribed={subscription.isSubscribed}
          listItems={listItems}
        />
      </Box>
    );
  }, [tiles, selection, subscription.isSubscribed]);

  const renderCoaching = useCallback(() => {
    let message: string = t("training.selectTraining.coachSportProhibitionMsg");

    switch (selection) {
      case "PLAN":
        message = t("training.selectTraining.coachSportProhibitionMsg");
        break;
      case "PREV":
        message = t("training.selectTraining.coachSportPreventionMsg");
        break;
      case "QUICK":
        message = t("training.selectTraining.coachSportStabilityMsg");
        break;
      default:
        message = t("training.selectTraining.coachSportProhibitionMsg");
        break;
    }

    return <Hint type="WARNING" message={message} />;
  }, [selection, t]);

  const renderTestCoaching = useCallback(() => {
    return (
      <FullScreenCoaching
        text={t("training.powerTest.todayIsPowerTest")}
        trainerSource={require("../../assets/img/coach/face.png")}
        goOnText={t("training.powerTest.startPowerTest")}
        goOnFunction={startPowerTest}
        skipText={t("training.powerTest.skipPowerTest")}
        skipFunction={skipPowerTest}
      />
    );
  }, [startPowerTest, skipPowerTest, t]);

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={handleBack} />,
        }}
      />
      {screenState === "SELECT" ? (
        <Box flex={1} backgroundColor="lightGrey1">
          {renderTiles()}
          <Box
            paddingHorizontal="m"
            paddingBottom="m"
            justifyContent="flex-end"
            alignItems="stretch"
          >
            {renderTrainingAdvice()}
          </Box>
          <Box
            paddingHorizontal="m"
            paddingBottom="m"
            justifyContent="flex-end"
            alignItems="stretch"
          >
            {renderCoaching()}
          </Box>
        </Box>
      ) : (
        renderTestCoaching()
      )}
    </>
  );
}
