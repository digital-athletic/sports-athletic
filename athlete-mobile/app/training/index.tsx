import { BackHeader } from "@/common/BackHeader";
import { FullScreenCoaching } from "@/common/FullScreenCoaching";
import {
  isSkillTypes,
  TileData,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { ColumnList } from "@/features/training/ColumnList";
import { useTrainingGapCheck } from "@/features/training/hooks/useTrainingGapCheck";
import type { TrainingSelectionType } from "@/features/training/models/Training";
import { useTrainingStore } from "@/features/training/trainingStore";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { hasAnyBarbell } from "@/features/training/utils/equipmentUtils";
import { isStrengthTestDue } from "@/features/training/utils/strengthTestUtils";
import { useHardwareBackHandler } from "@/hooks/useHardwareBackHandler";
import type { I18nKey } from "@/i18n";
import { Logger } from "@/services/Logger";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ScreenState = "SELECT" | "TEST";

const titleKeyFor = (
  screenState: ScreenState,
  selection: TrainingSelectionType | null,
): I18nKey => {
  if (screenState === "TEST") return "training.powerTest.title";
  if (selection === "QUICK") return "training.active.title.focus";
  if (selection === "PREV") return "training.active.title.prevention";
  return "training.selectTraining.title";
};

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
  const exercises = getAllExercises();
  const barbellAvailable = usePlacesStore((s) => hasAnyBarbell(s.places));
  const ageGroup = useAgeGroup();

  const [screenState, setScreenState] = useState<ScreenState>("SELECT");
  const [tiles, setTiles] = useState<TileData[]>([]);

  useTrainingGapCheck(selection === "PLAN");

  // Back handler
  const handleBack = useCallback(() => {
    setTrainingSelection(null);
    router.replace("/(tabs)/(home)");
    return true;
  }, [setTrainingSelection]);

  useHardwareBackHandler(handleBack);

  const title = t(titleKeyFor(screenState, selection));

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

    const lastTestExpired = isStrengthTestDue(
      workoutData.maxValues.testAt,
      Date.now(),
      ageGroup,
    );
    // look if exercises with Fmax used
    let needsFmaxValues = false;
    if (lastTestExpired) {
      const exerciseIds = sectionTrainings.reduce<string[]>(
        (acc, trainingDay) => {
          let dayExerciseIds = Object.keys(trainingDay.skills).reduce<string[]>(
            (acc2, skill) => {
              if (!isSkillTypes(skill)) {
                return acc2;
              }

              let additionalIds: string[] = [];
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
          exercise?.values?.weight?.startValue.type?.type === "weightFMax" ||
          exercise?.values?.weight?.targetValue.type?.type === "weightFMax"
        ) {
          needsFmaxValues = true;
          break;
        }
      }
    }

    if (lastTestExpired && needsFmaxValues && barbellAvailable) {
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
          picture: WorkoutConstants.DAILY_TRAINING_FOCUS_IMAGES[trainingFocus],
          title:
            WorkoutConstants.WEEKDAY_TRAINING_KEYS[userTrainingDay.weekday],
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
              originPath: "/training",
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
  }, [
    workoutData,
    selection,
    trainingPlan,
    trainingDays,
    exercises,
    t,
    barbellAvailable,
    ageGroup,
  ]);

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
    setTrainingSelection(null);
    Logger.logEvent("test_coaching_selected_start");
    router.push({
      pathname: "/training/muscle-soreness",
      params: { type: "TEST_WORKOUT", originPath: "/training" },
    });
  }, [setTrainingSelection]);

  const skipPowerTest = useCallback(() => {
    Logger.logEvent("test_coaching_selected_skip");
    setScreenState("SELECT");
  }, []);

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
        <ColumnList listItems={listItems} />
      </Box>
    );
  }, [tiles, selection]);

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
        </Box>
      ) : (
        renderTestCoaching()
      )}
    </>
  );
}
