import { BodyParts } from "@/bodyParts/BodyParts";
import { MuscleType } from "@/bodyParts/types";
import { Loading } from "@/common/Loading";
import { SharedConstants } from "@/constants/sharedConstants";
import {
  CardioTypes,
  FocusType,
  PlaceType,
  SectionTypes,
} from "@/constants/workoutConstants";
import { PlaceSelection } from "@/features/equipment/PlaceSelection";
import { type UserType } from "@/features/profile/models/User";
import { isGeneratorError } from "@/features/training/generators/GeneratorError";
import { buildGeneratorErrorMessage } from "@/features/training/generators/generatorErrorUtils";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import { ExerciseType } from "@/features/training/models/Exercise";
import { TrainingType } from "@/features/training/models/Training";
import { useTrainingStore } from "@/features/training/trainingStore";
import { Logger } from "@/services/Logger";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { useExercisesStore } from "@/store/exercisesStore";
import { usePlacesStore } from "@/store/placesStore";
import { useSkillTreesStore } from "@/store/skillTreesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { DDMMYYYYToDate } from "@/utils/date";
import { fieldNamesToLowerCase } from "@/utils/fieldNames";
import { parseBooleanParam, parseIntParam } from "@/utils/router";
import { BackHeader } from "@/common/BackHeader";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenState = "SORENESS" | "PLACE";

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
  const [screenState, setScreenState] = useState<ScreenState>("SORENESS");

  const { skillTrees } = useSkillTreesStore();
  const { branchData, exerciseData } = useExerciseProgressStore();
  const { trainingDays } = useTrainingScheduleStore();
  const { places } = usePlacesStore();
  const { workoutsList } = useCompletedWorkoutsStore();
  const { setExerciseList, setEquipment, setActiveTraining } =
    useTrainingStore();
  const { setExercises } = useExercisesStore();
  const { userId } = useUserProfileStore();
  const { workoutData, temporalData, setTemporalData, trainingPlan } =
    useUserWorkoutStore();
  const muscleTags =
    temporalData?.map<MuscleType>((data) => data.tag as MuscleType) ?? [];

  const gender = workoutData.gender === "MALE" ? "m" : "w";
  const { type } = params;

  const handleBack = useCallback(() => {
    if (screenState === "PLACE") {
      setScreenState("SORENESS");
    } else {
      router.back();
    }
    return true;
  }, [screenState, router]);

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
        temporalData.filter((data) => data.expiration.valueOf() > Date.now()),
      );
    }
    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExercises = async () => {
    // Previously this was imported from local file system (see: exercisesActions.loadExercises())
    const localData = await import(
      "../../assets/data/generator/Exercises.json"
    );

    const exercises = fieldNamesToLowerCase(
      localData.default,
    ) as ExerciseType[];

    setExercises(exercises);

    return exercises;
  };

  const setMuscles = (tags: string[]) => {
    // save updated muscle soreness to temporal data
    const temporalData = tags.map((tag) => ({
      tag,
      date: new Date(Date.now()),
      expiration: new Date(Date.now() + SharedConstants.TIME_IN_MS.DAY),
    }));

    setTemporalData(temporalData);
  };

  const generateExerciseList = async (place: PlaceType) => {
    const exercises = await loadExercises();

    const trainingType = params.type;

    if (!exercises) {
      Alert.alert(
        t("common.error"),
        t("training.generator.failedToLoadExerciseList"),
      );
      return;
    }

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
      workoutData,
      temporalData: temporalData ?? [],
      trainingPlan,
    };

    const test = parseBooleanParam(params.test);
    if (test && params.user) {
      try {
        user = JSON.parse(params.user) as UserType;
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
        lastWorkoutDate = new Date(lastWorkout.timestamp).toLocaleDateString(
          "de-DE",
        );
      }

      if (lastWorkoutDate) {
        const lastDate = DDMMYYYYToDate(lastWorkoutDate);
        daysSinceLastWorkout = Math.round(
          (today.getTime() - lastDate.getTime()) /
            SharedConstants.TIME_IN_MS.DAY,
        );
      }
    }

    const sectionIndex = parseIntParam(params.sectionIndex);

    const tg = new TrainingGenerator();
    const exerciseList = tg.generateTraining(
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

    // Save training data to store
    setExerciseList(exerciseList);
    setEquipment(equipment);
    setActiveTraining({
      type: trainingType,
      sectionIndex: sectionIndex,
      weekday: weekdayNumber,
      sectionType: params.sectionType,
      sectionCardioType: params.sectionCardioType,
      trainingFocus: params.trainingFocus,
    });
  };

  const generateTraining = async (place: PlaceType) => {
    // generate training
    setLoading(true);

    try {
      // generate exercise list
      await generateExerciseList(place);

      //start training
      router.navigate({
        pathname: "/training/training-overview",
        params: { ...params }, // pass on params
      });

      setLoading(false);
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

  const goOn = async () => {
    if (
      params.type !== "PLAN" &&
      params.type !== "TEST_WORKOUT" &&
      screenState === "SORENESS"
    ) {
      // switch to place selection
      setScreenState("PLACE");
    } else {
      generateTraining("STUDIO");
    }
  };

  const selectPlace = (value: PlaceType) => {
    generateTraining(value);
  };

  let title =
    screenState === "SORENESS"
      ? t("training.muscleSoreness.title")
      : t("training.muscleSoreness.placeAndEquipment");

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <BackHeader onBack={handleBack} />,
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
        {/* needs to be here so BodyParts isn't rendered at start while temp data is managed */}
        {loading ? (
          <Loading show={loading} text={t("training.muscleSoreness.loading")} />
        ) : (
          <>
            <Box flex={1} justifyContent="center" alignItems="stretch">
              {screenState === "SORENESS" ? (
                <Box flex={1}>
                  {type === "PLAN" ? (
                    <Text variant="title">
                      {t("training.muscleSoreness.title")}
                    </Text>
                  ) : null}
                  <BodyParts
                    type={"MUSCLE"}
                    gender={gender}
                    tags={muscleTags}
                    secondaryTags={[]}
                    onChange={setMuscles}
                    showChips
                    showsSoreness
                  />
                </Box>
              ) : (
                <PlaceSelection selectPlace={selectPlace} places={places} />
              )}
            </Box>
            {screenState === "SORENESS" ? (
              <Button onPress={goOn}>
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
