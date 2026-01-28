import { BackHeader } from "@/common/BackHeader";
import { Coaching } from "@/common/Coaching";
import { Loading } from "@/common/Loading";
import { ProgressBar } from "@/common/ProgressBar";
import { SkipHeader } from "@/common/SkipHeader";
import { isPlaceType, WorkoutConstants } from "@/constants/workoutConstants";
import { AnamnesisQuestionContainer } from "@/features/anamnesis/AnamnesisQuestionContainer";
import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import { validateDaySelection } from "@/features/anamnesis/utils/trainingDays";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { SelectionInputField } from "@/form/SelectionInputField";
import { SnapSliderInputField } from "@/form/SnapSliderInputField";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { getTagValue } from "@/utils/tagUtils";
import { Route, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ originPath?: Route }>();
  const originPath = params.originPath;
  const [isLoading, setIsLoading] = useState(false);

  const {
    workoutData: { tags },
  } = useUserWorkoutStore();

  const { seasonPhase } = useAnamnesisStore();
  const { anamnesisCompleted } = useUserProfileStore();
  const { trainingDays, toggleDay, setDayLocation, setDayDuration } =
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

  const renderDayButton = (weekday: number) => {
    const day = trainingDays[weekday];
    const dayKey = DAY_KEYS[weekday];
    const label = t(`common.days.${dayKey}`);

    const isActive = day.active;
    const bgColor = isActive ? colors.primary : colors.lightGrey1;
    const textColor = isActive ? "white" : "primary";
    const borderColor = colors.primary;

    return (
      <Pressable
        key={weekday}
        onPress={() => handleToggleDay(weekday)}
        style={[
          styles.dayButton,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
      >
        <Text style={[styles.dayButtonText]} color={textColor}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const getDayTitle = (weekday: number): string => {
    return t(WorkoutConstants.WEEKDAY_TRAINING_KEYS[weekday]);
  };

  const handleChangeLocation = (weekday: number, selectedValues: string[]) => {
    if (selectedValues.length > 0) {
      const location = selectedValues[0];
      if (isPlaceType(location)) {
        setDayLocation(weekday, location);
      }
    }
  };

  const handleChangeDuration = (weekday: number, durationMinutes: number) => {
    setDayDuration(weekday, durationMinutes);
  };

  const renderDayDetails = (weekday: number) => {
    const day = trainingDays[weekday];

    if (!day.active) {
      return null;
    }

    // Get duration options based on user level and age group
    const userLevel = (getTagValue(tags, "LEVEL") ||
      WorkoutConstants.LEVELS.BEGINNER) as
      | "BEGINNER"
      | "ADVANCED"
      | "PROFESSIONAL";

    // Treat adolescents as adults for duration options
    const durationOptionsRaw =
      WorkoutConstants.DURATION_OPTIONS[userLevel]?.[
        ageGroup === "ADOLESCENT" ? "ADULT" : ageGroup
      ] || WorkoutConstants.DEFAULT_DURATION_OPTIONS;

    // Convert numeric labels to strings for SnapSliderInputField
    const durationOptions = durationOptionsRaw.map((opt) => ({
      value: opt.value,
      label: opt.label.toString(),
    }));

    // Find current duration index
    const currentDuration = day.duration ? day.duration : null;
    const currentIndex = currentDuration
      ? durationOptions.findIndex((opt) => opt.value === currentDuration)
      : 0;
    const startIndex = currentIndex >= 0 ? currentIndex : 0;

    return (
      <Box key={`day_details_${weekday}`}>
        <AnamnesisQuestionContainer
          title={{ default: getDayTitle(weekday) }}
          description={{
            default: t("screens.trainingDays.whereDoYouWorkOut"),
          }}
        >
          <SelectionInputField
            onChange={(values) => handleChangeLocation(weekday, values)}
            iconName="home"
            selectedItems={day.place ? [day.place] : []}
            items={WorkoutConstants.TRAINING_PLACES}
            singleSelection={true}
          />
          <View style={styles.timeSelectionContainer}>
            <View style={styles.innerContainer}>
              <SnapSliderInputField
                startItem={startIndex}
                onChange={(value) => handleChangeDuration(weekday, value)}
                sliderOptions={durationOptions}
                descriptionText={t("screens.trainingDays.howManyMinutes")}
              />
            </View>
          </View>
        </AnamnesisQuestionContainer>
      </Box>
    );
  };

  const renderTooltip = () => {
    // Get recommended days and duration based on season phase and level
    let phase = "";
    if (seasonPhase?.type) {
      phase = t(`screens.seasonPhase.phases.${seasonPhase.type}`);
    }

    // Get recommendations from constants based on level and age group
    const userLevel = (getTagValue(tags, "LEVEL") ||
      WorkoutConstants.LEVELS.BEGINNER) as
      | "BEGINNER"
      | "ADVANCED"
      | "PROFESSIONAL";

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
      <Box padding="m">
        <Text variant="body" textAlign="center">
          {t("screens.trainingDays.tooltipRecommendation", {
            phase,
            days: recommendedDays,
            minutes: recommendedMinutes,
          })}
        </Text>
      </Box>
    );
  };

  const showCoaching =
    seasonPhase?.type === SeasonPhase.PREPARATORY ||
    seasonPhase?.type === SeasonPhase.COMPETITION;

  // Calculate progress for progress bar
  const maxSteps = originPath === "/more" ? 2 : 3 + 3;
  const progress = originPath === "/more" ? 2 : 3 + 3;

  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t("screens.trainingDays.title"),
          headerLeft: () => <BackHeader onBack={handleBack} />,
          headerRight: () => (
            <SkipHeader
              alertTitle="screens.trainingDays.abortQuestion"
              alertMessage={
                hasActiveDay
                  ? "screens.trainingDays.abortExplanation"
                  : "screens.trainingDays.abortIncomplete"
              }
            />
          ),
        }}
      />
      <Box
        flex={1}
        backgroundColor="lightGrey1"
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollBox>
          <ProgressBar progress={progress} maximum={maxSteps} />

          {showCoaching && (
            <Box paddingHorizontal="m" paddingTop="s">
              <Coaching text={t("screens.trainingDays.coachingMessage")} />
            </Box>
          )}

          <Box paddingHorizontal="m" paddingVertical="s">
            <Text variant="title" marginBottom="s">
              {t("screens.trainingDays.subtitle")}
            </Text>
          </Box>

          <Box
            flexDirection="row"
            justifyContent="space-evenly"
            paddingHorizontal="m"
            paddingVertical="m"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((weekday) => renderDayButton(weekday))}
          </Box>

          {trainingDays.some((day) => day.active) ? (
            <Box>
              {renderDayDetails(0)}
              {renderDayDetails(1)}
              {renderDayDetails(2)}
              {renderDayDetails(3)}
              {renderDayDetails(4)}
              {renderDayDetails(5)}
              {renderDayDetails(6)}
            </Box>
          ) : (
            renderTooltip()
          )}
        </ScrollBox>

        <Button onPress={handleGoOn} margin="m" disabled={isLoading}>
          {t("common.goOn")}
        </Button>

        <Loading show={isLoading} text={t("common.generatingTrainingPlan")} />
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  dayButton: {
    height: 46,
    width: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timeSelectionContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch",
    alignSelf: "stretch",
    paddingVertical: 16,
  },
});
