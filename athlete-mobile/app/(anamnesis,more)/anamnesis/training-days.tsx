import { Loading } from "@/common/Loading";
import { SkipHeader } from "@/common/SkipHeader";
import {
  isPlaceType,
  type LevelTag,
  WorkoutConstants,
} from "@/constants/workoutConstants";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { CoachTip } from "@/features/anamnesis/components/CoachTip";
import { TrainingDayCard } from "@/features/anamnesis/components/TrainingDayCard";
import { WeekdayToggle } from "@/features/anamnesis/components/WeekdayToggle";
import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { validateDaySelection } from "@/features/anamnesis/utils/trainingDays";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { getUserTagValue } from "@/utils/tagUtils";
import { RoutePath, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export default function TrainingDays() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: RoutePath }>();
  const originPath = params.originPath;
  const [isLoading, setIsLoading] = useState(false);

  const {
    workoutData: { tags },
  } = useUserWorkoutStore();

  const { seasonPhase } = useAnamnesisStore();
  const { anamnesisCompleted } = useUserProfileStore();
  const { trainingDays, toggleDay, setDayPlace, setDayDuration } =
    useTrainingScheduleStore();
  const ageGroup = useAgeGroup();
  const hasActiveDay = trainingDays.some((day) => day.active);

  const handleBack = () => {
    router.back();
  };

  const handleGoOn = async () => {
    setIsLoading(true);

    const hasActiveDay = trainingDays.some((day) => day.active);

    if (!hasActiveDay) {
      Alert.alert(
        t("screens.trainingDays.noDaySelectedTitle"),
        t("screens.trainingDays.noDaySelectedMessage"),
      );
      setIsLoading(false);
      return;
    }

    // Check if anamnesis is completed and season phase is set
    if (anamnesisCompleted && seasonPhase?.endDate && seasonPhase?.type) {
      // Navigate to generating screen which will save the season phase
      router.navigate("/anamnesis/generating");
    } else {
      // Anamnesis incomplete - show alert
      Alert.alert(
        t("screens.trainingDays.anamnesisIncompleteTitle"),
        t("screens.trainingDays.anamnesisIncompleteMessage"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              if (originPath === "/(tabs)/(more)/more") {
                router.navigate("/(tabs)/(more)/more");
              } else {
                router.navigate("/(tabs)/(home)");
              }
            },
          },
        ],
      );
    }

    setIsLoading(false);
  };

  const handleToggleDay = (weekday: number) => {
    const isChild = ageGroup === WorkoutConstants.AGE_GROUPS.CHILD;
    const clickedDay = trainingDays[weekday];

    if (clickedDay.active) {
      // Always allow deselection
      toggleDay(weekday);
      return;
    }

    // Validate if this day can be selected
    const isValid = validateDaySelection(trainingDays, weekday, isChild);

    if (!isValid) {
      Alert.alert(
        t("screens.trainingDays.daySelectionNotPossibleTitle"),
        t(
          isChild
            ? "screens.trainingDays.daySelectionNotPossibleChild"
            : "screens.trainingDays.daySelectionNotPossibleAdult",
        ),
      );
      return;
    }

    toggleDay(weekday);
  };

  const userLevel = (getUserTagValue(tags, "LEVEL") ||
    WorkoutConstants.LEVELS.BEGINNER) as LevelTag;

  const handleChangeLocation = (weekday: number, location: string) => {
    if (isPlaceType(location)) {
      setDayPlace(weekday, location);
    }
  };

  const renderTooltip = () => {
    // Get recommended days and duration based on season phase and level
    let phase = "";
    if (seasonPhase?.type) {
      phase = t(`screens.seasonPhase.phases.${seasonPhase.type}`);
    }

    const seasonType = seasonPhase?.type || SeasonPhase.PAUSE;

    const recommendedDays =
      WorkoutConstants.RECOMMENDATIONS_TRAINING_DAYS[userLevel]?.[ageGroup]?.[
        seasonType
      ] || WorkoutConstants.RECOMMENDATIONS_TRAINING_DAYS.BEGINNER.CHILD.PAUSE;
    const recommendedMinutes =
      WorkoutConstants.RECOMMENDATIONS_TRAINING_MINUTES[userLevel]?.[
        ageGroup
      ]?.[seasonType] ||
      WorkoutConstants.RECOMMENDATIONS_TRAINING_MINUTES.BEGINNER.CHILD.PAUSE;

    return (
      <CoachTip
        text={t("screens.trainingDays.tooltipRecommendation", {
          phase,
          days: recommendedDays,
          minutes: recommendedMinutes,
        })}
      />
    );
  };

  const showCoaching =
    seasonPhase?.type === SeasonPhase.PREPARATORY ||
    seasonPhase?.type === SeasonPhase.COMPETITION;

  // Calculate progress for progress bar
  const maxSteps = originPath === "/more" ? 2 : 3 + 3;
  const progress = originPath === "/more" ? 2 : 3 + 3;

  return (
    <>
      <HeadlineScreen
        title={t("screens.trainingDays.title")}
        heading={t("screens.trainingDays.subtitle")}
        description={
          showCoaching ? t("screens.trainingDays.coachingMessage") : undefined
        }
        step={{ current: progress, total: maxSteps }}
        onBack={handleBack}
        headerRight={
          <SkipHeader
            alertTitle="screens.trainingDays.abortQuestion"
            alertMessage={
              hasActiveDay
                ? "screens.trainingDays.abortExplanation"
                : "screens.trainingDays.abortIncomplete"
            }
          />
        }
        action={{
          label: t("common.goOn"),
          onPress: handleGoOn,
          disabled: isLoading,
        }}
      >
        <Box flexDirection="row" gap="xs">
          {trainingDays.map((day) => (
            <WeekdayToggle
              key={day.weekday}
              label={t(`common.days.${DAY_KEYS[day.weekday]}`)}
              active={day.active}
              onPress={() => handleToggleDay(day.weekday)}
            />
          ))}
        </Box>

        {!hasActiveDay && renderTooltip()}
        {trainingDays
          .filter((day) => day.active)
          .map((day) => (
            <TrainingDayCard
              key={day.weekday}
              day={day}
              userLevel={userLevel}
              ageGroup={ageGroup}
              onChangePlace={(place) =>
                handleChangeLocation(day.weekday, place)
              }
              onChangeDuration={(duration) =>
                setDayDuration(day.weekday, duration)
              }
            />
          ))}
      </HeadlineScreen>
      <Loading show={isLoading} text={t("common.generatingTrainingPlan")} />
    </>
  );
}
