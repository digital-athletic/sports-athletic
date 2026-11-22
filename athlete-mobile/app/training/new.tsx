import { BackHeader } from "@/common/BackHeader";
import { FullScreenCoaching } from "@/common/FullScreenCoaching";
import { TileData, WorkoutConstants } from "@/constants/workoutConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { AthleticWarmupGrid } from "@/features/training/AthleticWarmupGrid";
import { FocusTrainingGrid } from "@/features/training/FocusTrainingGrid";
import { PlanDayScreen } from "@/features/training/PlanDayScreen";
import { PreventionBodyPartScreen } from "@/features/training/PreventionBodyPartScreen";
import { useActiveSectionIndex } from "@/features/training/hooks";
import { useTrainingGapCheck } from "@/features/training/hooks/useTrainingGapCheck";
import {
  isTrainingCategory,
  type TrainingCategory,
} from "@/features/training/models/Training";
import { getSectionForDate } from "@/features/training/trainingUtils";
import { hasAnyBarbell } from "@/features/training/utils/equipmentUtils";
import { listPlannedExerciseIds } from "@/features/training/utils/plannedBranches";
import { isStrengthTestDue } from "@/features/training/utils/strengthTestUtils";
import type { I18nKey } from "@/i18n";
import { Logger } from "@/services/Logger";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import { type ComponentType, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ScreenState = "SELECT" | "TEST";

type GridCategory = Exclude<TrainingCategory, "plan">;

type CategoryScreenProps = { title: string; onBack: () => void };

const CATEGORY_SCREENS: Record<
  GridCategory,
  { titleKey: I18nKey; Screen: ComponentType<CategoryScreenProps> }
> = {
  focus: { titleKey: "training.active.title.focus", Screen: FocusTrainingGrid },
  athleticWarmup: {
    titleKey: "training.active.title.athleticWarmup",
    Screen: AthleticWarmupGrid,
  },
  prevention: {
    titleKey: "training.active.title.prevention",
    Screen: PreventionBodyPartScreen,
  },
};

const handleBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)/(home)");
  }
};

/**
 * Selection screen at /training/new?category=plan|focus|athleticWarmup|prevention,
 * the first step of a new training. A missing or unknown category redirects to Home.
 * Back has no Android handler of its own, so the default pop applies like the
 * header arrow and the iOS swipe.
 * Legacy: views/training/SelectTraining
 */
export default function NewTraining() {
  const { t } = useTranslation();
  const { category } = useLocalSearchParams<{ category?: string }>();

  if (!isTrainingCategory(category)) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  if (category === "plan") {
    return <SelectPlanTraining />;
  }

  const { titleKey, Screen } = CATEGORY_SCREENS[category];
  return <Screen title={t(titleKey)} onBack={handleBack} />;
}

/** Shows the plan days, with the power test coaching when a test is due. */
function SelectPlanTraining() {
  const { t } = useTranslation();

  const { workoutData, trainingPlan } = useUserWorkoutStore();
  const { trainingDays } = useTrainingScheduleStore();
  const exercises = getAllExercises();
  const barbellAvailable = usePlacesStore((s) => hasAnyBarbell(s.places));
  const ageGroup = useAgeGroup();

  const [screenState, setScreenState] = useState<ScreenState>("SELECT");
  const activeSectionIndex = useActiveSectionIndex(
    trainingPlan?.sections ?? [],
  );

  useTrainingGapCheck(true);

  const title = t(
    screenState === "TEST"
      ? "training.powerTest.title"
      : "training.selectTraining.title",
  );

  const getTrainingDays = useCallback((): TileData[] => {
    if (!workoutData || !trainingPlan) {
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
      for (const id of listPlannedExerciseIds(sectionTrainings)) {
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
            text: "training.selectTraining.dayDetails",
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
    trainingPlan,
    trainingDays,
    exercises,
    t,
    barbellAvailable,
    ageGroup,
  ]);

  const tiles = useMemo<TileData[]>(() => getTrainingDays(), [getTrainingDays]);

  const activeSection = trainingPlan?.sections[activeSectionIndex];
  const currentPhase =
    activeSection && t(`training.sections.${activeSection.type}`);

  const startPowerTest = () => {
    Logger.logEvent("test_coaching_selected_start");
    router.push({
      pathname: "/training/muscle-soreness",
      params: { type: "TEST_WORKOUT" },
    });
  };

  const skipPowerTest = () => {
    Logger.logEvent("test_coaching_selected_skip");
    setScreenState("SELECT");
  };

  const renderTestCoaching = () => {
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
  };

  if (screenState === "SELECT") {
    return (
      <PlanDayScreen
        title={title}
        phase={currentPhase}
        days={tiles}
        onBack={handleBack}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={handleBack} />,
        }}
      />
      {renderTestCoaching()}
    </>
  );
}
