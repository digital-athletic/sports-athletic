import { MuscleSorenessSelector } from "@/bodyParts/MuscleSorenessSelector";
import { Alert } from "@/common/Alert";
import { MuscleType } from "@/bodyParts/types";
import { BackHeader } from "@/common/BackHeader";
import { Loading } from "@/common/Loading";
import { SharedConstants } from "@/constants/sharedConstants";
import {
  CardioTypes,
  FocusType,
  PlaceType,
  SectionTypes,
} from "@/constants/workoutConstants";
import { getAllExercises } from "@/data/exerciseRegistry";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { PlaceSelection } from "@/features/equipment/PlaceSelection";
import { isGeneratorError } from "@/features/training/generators/GeneratorError";
import { buildGeneratorErrorMessage } from "@/features/training/generators/generatorErrorUtils";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import { TrainingType } from "@/features/training/models/Training";
import { useTrainingAlerts } from "@/features/training/hooks/useTrainingAlerts";
import { useTrainingStore } from "@/features/training/trainingStore";
import { shouldShowPainAlert } from "@/features/training/utils/painUtils";
import { toUserExerciseDataList } from "@/schemas/generator.schema";
import { type UserType, parseUserType } from "@/schemas/user.schema";
import { Logger } from "@/services/Logger";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { formatDateToISO, ISODateToDate } from "@/utils/date";
import { parseBooleanParam, parseIntParam } from "@/utils/router";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenState = "SORENESS" | "PLACE";

// The soreness blocker points users to focus and prevention trainings, so
// those skip the check.
const checksSoreness = (type: TrainingType) =>
  type === "PLAN" || type === "TEST_WORKOUT";
const screenStateFor = (type: TrainingType): ScreenState =>
  checksSoreness(type) ? "SORENESS" : "PLACE";

type ScreenParams = {
  type: TrainingType;
  weekday?: string;
  sectionIndex?: string;
  originPath?: string;
  sectionType?: SectionTypes;
  sectionCardioType?: CardioTypes;
  trainingFocus?: FocusType;
  test?: string;
  user?: string; // User persona as JSON string
};

/**
 * Muscle Soreness Screen
 *
 * User reports muscle soreness before training.
 * Legacy: views/training/MuscleSoreness
 */
export default function MuscleSorenessScreen() {
  const params = useLocalSearchParams<
    "/training/muscle-soreness",
    ScreenParams
  >();
  const router = useRouter();

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const screenState = screenStateFor(params.type);
  const { showPainAlert } = useTrainingAlerts();

  const skillTrees = getAllSkillTrees();
  const exercises = getAllExercises();
  const { branchData, exerciseData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { workoutsList } = useCompletedWorkoutsStore();
  const { setExerciseList, setEquipment, setActiveTraining, clearTraining } =
    useTrainingStore();
  const { auth } = useAuthStore();
  const userId = auth?.userId;
  const { personalData } = useUserProfileStore();
  const { workoutData, temporalData, setTemporalData, trainingPlan } =
    useUserWorkoutStore();
  const muscleTags =
    temporalData?.map<MuscleType>((data) => data.tag as MuscleType) ?? [];

  const handleBack = useCallback(() => {
    router.back();
    return true;
  }, [router]);

  useEffect(() => {
    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBack,
    );
    return () => handler.remove();
  }, [handleBack]);

  useEffect(() => {
    if (temporalData) {
      setTemporalData(
        temporalData.filter(
          (data) => new Date(data.expiration).valueOf() > Date.now(),
        ),
      );
    }
    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMuscles = (tags: string[]) => {
    // save updated muscle soreness to temporal data
    const temporalData = tags.map((tag) => ({
      tag,
      date: new Date(Date.now()).toISOString(),
      expiration: new Date(
        Date.now() + SharedConstants.TIME_IN_MS.DAY,
      ).toISOString(),
    }));

    setTemporalData(temporalData);
  };

  const generateExerciseList = (place: PlaceType) => {
    const trainingType = params.type;

    let selectedPlace = place;
    const weekdayNumber = parseIntParam(params.weekday);
    if (trainingType === "PLAN" && weekdayNumber !== undefined) {
      if (trainingDays[weekdayNumber]) {
        selectedPlace = trainingDays[weekdayNumber].place;
      }
    }

    const equipment = places[selectedPlace]?.equipment ?? [];

    let user: UserType = {
      userId: userId ?? "test-user",
      personalData,
      workoutData,
      // Soreness from an earlier training must not block a type that skips the check.
      temporalData: checksSoreness(trainingType) ? (temporalData ?? []) : [],
      trainingPlan,
    };

    const test = parseBooleanParam(params.test);
    if (test && params.user) {
      try {
        const parsed = JSON.parse(params.user);
        const validated = parseUserType(parsed);
        if (validated.success) {
          user = validated.data as UserType;
        } else {
          Logger.logError(new Error(validated.error));
        }
      } catch (e) {
        if (e instanceof Error) {
          Logger.logError(e);
        }
      }
    }

    // Calculate days since last workout
    let daysSinceLastWorkout = 0;
    if (trainingType === "PLAN") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let lastWorkoutDate: string | null = null;
      if (workoutsList && workoutsList.length > 0) {
        const lastWorkout = workoutsList[workoutsList.length - 1];
        lastWorkoutDate = formatDateToISO(new Date(lastWorkout.timestamp));
      }

      if (lastWorkoutDate) {
        // ISODateToDate handles both ISO 8601 and legacy DD-MM-YYYY formats
        const lastDate = ISODateToDate(lastWorkoutDate);
        daysSinceLastWorkout = Math.round(
          (today.getTime() - lastDate.getTime()) /
            SharedConstants.TIME_IN_MS.DAY,
        );
      }
    }

    const sectionIndex = parseIntParam(params.sectionIndex);

    const tg = new TrainingGenerator();
    const generatedList = tg.generateTraining(
      trainingType,
      user,
      selectedPlace,
      exercises,
      skillTrees,
      weekdayNumber ?? 0,
      equipment,
      sectionIndex,
      daysSinceLastWorkout,
      {
        exerciseData,
        branchData,
      },
    );

    // Convert generated list to user exercise data format and save to store
    // Stale session state from a killed workout must not leak into the new session.
    // clearTraining preserves `selection` so the user's training selection is unaffected.
    clearTraining();
    const exerciseList = toUserExerciseDataList(generatedList);
    setExerciseList(exerciseList);
    setEquipment(equipment);
    setActiveTraining({
      id: `workout-${Date.now()}`,
      type: trainingType,
      sectionIndex: sectionIndex,
      weekday: weekdayNumber,
      sectionType: params.sectionType,
      sectionCardioType: params.sectionCardioType,
      trainingFocus: params.trainingFocus,
    });
    return exerciseList;
  };

  const generateTraining = (place: PlaceType) => {
    // generate training
    setLoading(true);

    try {
      const exerciseList = generateExerciseList(place);

      const startTraining = () => {
        router.navigate({
          pathname: "/training/training-overview",
          params: { ...params, place }, // pass on params including place
        });
        setLoading(false);
      };

      if (shouldShowPainAlert(params.type, exerciseList, workoutData.tags)) {
        showPainAlert(startTraining);
      } else {
        startTraining();
      }
    } catch (e) {
      let message = t("common.error");

      if (isGeneratorError(e)) {
        message = buildGeneratorErrorMessage(e, t);
        Logger.logError(new Error(message));
      } else if (e instanceof Error) {
        Logger.logError(e);
      }

      Alert.alert(t("training.generator.errorTitleGenerator"), message, [
        {
          text: t("common.ok"),
          onPress: async () => {
            setLoading(false);
            router.replace("/(tabs)/(home)");
          },
        },
      ]);
    }
  };

  let title =
    screenState === "SORENESS"
      ? t("training.muscleSoreness.title")
      : t("training.muscleSoreness.placeAndEquipment");

  return (
    <>
      {/* The silhouette regions get too small to tap in landscape. */}
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={handleBack} />,
          orientation: screenState === "SORENESS" ? "portrait" : "all",
        }}
      />
      <Box
        flex={1}
        justifyContent="center"
        alignItems="stretch"
        paddingHorizontal="m"
        paddingVertical="s"
        style={{ paddingBottom: insets.bottom }}
      >
        {/* needs to be here so the selector isn't rendered at start while temp data is managed */}
        {loading ? (
          <Loading show={loading} text={t("training.muscleSoreness.loading")} />
        ) : (
          <>
            <Box flex={1} justifyContent="center" alignItems="stretch">
              {screenState === "SORENESS" ? (
                <Box flex={1}>
                  {params.type === "PLAN" ? (
                    <Text variant="title">
                      {t("training.muscleSoreness.title")}
                    </Text>
                  ) : null}
                  <MuscleSorenessSelector
                    tags={muscleTags}
                    onChange={setMuscles}
                  />
                </Box>
              ) : (
                <ScrollBox
                  contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                  }}
                >
                  <PlaceSelection
                    selectPlace={generateTraining}
                    places={places}
                  />
                </ScrollBox>
              )}
            </Box>
            {screenState === "SORENESS" ? (
              <Button onPress={() => generateTraining("STUDIO")}>
                {t("training.muscleSoreness.continue")}
              </Button>
            ) : (
              <Box />
            )}
          </>
        )}
      </Box>
    </>
  );
}
