import { Ionicon } from "@/common/Ionicon";
import { TagGroups } from "@/constants/tagGroups";
import { isSkillTypes, WorkoutConstants } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import {
  FOOTER_HEIGHT,
  TrainingFooter,
} from "@/features/training/TrainingFooter";
import { TrainingNavigation } from "@/features/training/TrainingNavigation";
import { useExerciseCompletion } from "@/features/training/hooks/useExerciseCompletion";
import { useFinishTraining } from "@/features/training/hooks/useFinishTraining";
import { isPauseExercise as checkIsPauseExercise } from "@/features/training/models/IdTypes";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { useTrainingStore } from "@/features/training/trainingStore";
import { isFeedbackEligibleSkill } from "@/features/training/utils/exerciseDataUtils";
import { heartRateBySkillAndBirthday } from "@/features/training/utils/heartRateUtils";
import {
  isPreventionSkill,
  mapSkillCodeToFocusArea,
} from "@/features/training/utils/skillTreeUtils";
import { logTrainingEvent } from "@/features/training/utils/trainingEventUtils";
import { deriveWeightForExercise } from "@/features/training/utils/workoutUtils";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { getTagValues, getUserTagValues } from "@/utils/tagUtils";
import { VideoPlayer } from "@/video/VideoPlayer";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TRAINING_INPUT_OFFSET = 100;

function formatExerciseDuration(seconds: number): {
  value: string;
  unit: string;
} {
  if (seconds < 60) return { value: String(seconds), unit: "sec" };
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return { value: String(mins), unit: "min" };
  return { value: `${mins} min`, unit: `${secs} sec` };
}

type TrainingActiveProps = Record<string, never>;

/**
 * Active training execution screen - displays exercises, tracks progress.
 * Prevents accidental exits during training via disabled back gestures.
 * Legacy: views/training/Training
 */
const TrainingActive: FC<TrainingActiveProps> = () => {
  useKeepAwake();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Training store state
  const {
    exerciseList,
    activeTraining,
    activeExerciseIndex,
    setActiveExerciseIndex,
    addPauseTime,
    addSkillTime,
  } = useTrainingStore();
  const { personalData } = useUserProfileStore();
  const { workoutData } = useUserWorkoutStore();
  const {
    saveExerciseAndBranchData,
    saveRepsInput,
    handleFeedback: completeFeedback,
    handleExerciseSkipped: markExerciseSkipped,
  } = useExerciseCompletion();
  const { finishTraining } = useFinishTraining();

  // Local state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [maxFWarningPopUpShowable, setMaxFWarningPopUpShowable] =
    useState(true);
  const [weightCalculationPopUpShowable, setWeightCalculationPopUpShowable] =
    useState(true);
  const exerciseStartTimeRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number>(Date.now());
  const [isSkipped, setIsSkipped] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  const headerTitle = useMemo(() => {
    const type = activeTraining?.type;

    if (!type) {
      return t("training.active.title.plan");
    }

    // Strength test
    if (type === "TEST_WORKOUT") {
      return t("training.active.title.strengthTest");
    }

    // Focus or Prevention training
    if (isSkillTypes(type)) {
      return t(`training.skill.${type}`, {
        defaultValue: isPreventionSkill(type)
          ? t("training.active.title.prevention")
          : t("training.active.title.focus"),
      });
    }

    return t("training.active.title.plan");
  }, [activeTraining?.type, t]);

  // Clamp guards against a persisted index that exceeds the current exercise list length
  // (e.g. after a workout is regenerated with fewer exercises).
  const safeExerciseIndex = Math.min(
    activeExerciseIndex,
    (exerciseList?.length ?? 1) - 1,
  );
  const currentExercise = exerciseList?.[safeExerciseIndex];
  const exerciseId = currentExercise?.exerciseId ?? "-1";
  const isPauseExercise = checkIsPauseExercise(exerciseId);
  const currentExerciseData = getExerciseById(exerciseId);

  const nextExerciseIndex = safeExerciseIndex + 1;
  const hasNextExercise = nextExerciseIndex < (exerciseList?.length ?? 0);
  const nextExercise = hasNextExercise
    ? exerciseList?.[nextExerciseIndex]
    : undefined;
  const isNextExercisePause = nextExercise
    ? checkIsPauseExercise(nextExercise.exerciseId)
    : false;
  const nextExerciseData = nextExercise
    ? getExerciseById(nextExercise.exerciseId)
    : undefined;

  const handlePainAlert = () => {
    const userPains = getUserTagValues(workoutData.tags, TagGroups.PAIN);
    if (userPains.length > 0) {
      Alert.alert(
        t("training.active.strengthTestAlert.title"),
        t("training.active.strengthTestAlert.message"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              setMaxFWarningPopUpShowable(false);
            },
          },
        ],
      );
    }
  };

  const handleBarbellWeightAlert = () => {
    Alert.alert(
      t("training.active.weightCalculationAlert.title"),
      t("training.active.weightCalculationAlert.message"),
      [
        {
          text: t("common.ok"),
          onPress: () => {
            setWeightCalculationPopUpShowable(false);
          },
        },
      ],
    );
  };

  // strengthTestMaxValues only provided for strength test's last exercise
  const advanceToNextExercise = (
    strengthTestMaxValues?: MaxValuesType | null,
  ) => {
    if (!exerciseList) return;

    // save exercise data
    saveExerciseAndBranchData(safeExerciseIndex);

    if (isPauseExercise) {
      // add time in pause to training stats
      const pauseDuration = Date.now() - pauseStartRef.current;
      addPauseTime(pauseDuration);

      if (
        maxFWarningPopUpShowable &&
        nextExercise?.weightType === "weightFMax"
      ) {
        handlePainAlert();
      }

      const isNextExerciseWithBarbell = getTagValues(
        nextExerciseData?.tags ?? [],
        TagGroups.EQUIPMENT,
      ).some((item) => item.includes("BARBELL"));

      if (
        weightCalculationPopUpShowable &&
        activeTraining?.type === "TEST_WORKOUT" &&
        isNextExerciseWithBarbell
      ) {
        handleBarbellWeightAlert();
      }
    } else if (currentExercise?.skill) {
      // Add exercise time to skill (analytics) -> addTrainingSkillTime
      const exerciseDuration = Date.now() - exerciseStartTimeRef.current;
      const focusArea = mapSkillCodeToFocusArea(currentExercise.skill);
      if (focusArea) {
        addSkillTime(focusArea, exerciseDuration);
      }
    }

    if (safeExerciseIndex < exerciseList.length - 1) {
      setActiveExerciseIndex(safeExerciseIndex + 1);

      if (isNextExercisePause) {
        // set pause timer to new start
        pauseStartRef.current = Date.now();
      } else {
        exerciseStartTimeRef.current = Date.now();
      }
    } else {
      // Training complete
      finishTraining(false, strengthTestMaxValues);
    }
  };

  const handleAbortTraining = useCallback(() => {
    Alert.alert(
      t("training.active.abort.question"),
      t("training.active.abort.explanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => {
            setIsAborted(true);
            finishTraining(true);
          },
        },
        {
          text: t("common.no"),
        },
      ],
    );
  }, [finishTraining, t]);

  const handleExerciseSkipped = () => {
    setIsSkipped(true);
    markExerciseSkipped(safeExerciseIndex);
    advanceToNextExercise();
  };

  useEffect(() => {
    setIsSkipped(false);
  }, [exerciseId]);

  const handleFeedback = (category: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => {
    completeFeedback(safeExerciseIndex, category);
  };

  const handlePauseToggled = (wasPaused: boolean) => {
    if (wasPaused) {
      // Resume: add pause duration to tracking
      const pauseDuration = Date.now() - pauseStartRef.current;
      exerciseStartTimeRef.current += pauseDuration;
    } else {
      // Pause: mark start of pause
      pauseStartRef.current = Date.now();
    }
  };

  // Handle back button - prevent accidental exit
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          handleAbortTraining();
          return true;
        },
      );

      return () => subscription.remove();
    }, [handleAbortTraining]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
      };
    }, []),
  );

  // Log training started
  useEffect(() => {
    logTrainingEvent(activeTraining, "training_started");
    exerciseStartTimeRef.current = Date.now();
  }, [activeTraining]);

  if (!exerciseList || exerciseList.length === 0) {
    return (
      <Box
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="l"
        backgroundColor="white"
      >
        <Text variant="title">{t("common.loading")}</Text>
      </Box>
    );
  }

  const progress = safeExerciseIndex / exerciseList.length;
  const isTestExercise = currentExercise?.repetition === -1;
  const isCardioExercise = currentExercise?.skill?.includes("CARDIO") ?? false;
  // Endurance exercises show a checkmark instead of a countdown timer. This app focuses on
  // strength training, so we defer detailed endurance tracking to dedicated apps.
  const isEnduranceExercise =
    currentExercise?.skill === "CARDIO_4" ||
    currentExercise?.skill === "CARDIO_5";
  const isLastInSet = currentExercise?.set?.[0] === currentExercise?.set?.[1];

  const name = isPauseExercise
    ? (nextExerciseData?.displayName ?? nextExerciseData?.name)
    : (currentExerciseData?.displayName ?? currentExerciseData?.name);

  const video = isPauseExercise
    ? nextExerciseData?.video
    : currentExerciseData?.video;

  const isFeedbackSkill = currentExercise
    ? isFeedbackEligibleSkill(activeTraining, currentExercise.skill)
    : false;

  const handleShowExerciseInformation = () => {
    const id = isPauseExercise ? nextExercise?.exerciseId : exerciseId;

    if (!id || id === "-1") {
      return;
    }

    router.navigate({
      pathname: "/training/exercise-information",
      params: {
        exerciseId: id,
      },
    });
  };

  const renderWeightOrHeight = () => {
    if (!currentExercise || !currentExerciseData) {
      return null;
    }

    const weight = currentExercise?.weight;
    const height = currentExercise?.height;

    // Weight information (truthy check filters out NaN, undefined, null, 0)
    if (weight) {
      const currentExerciseEquipment = getTagValues(
        currentExerciseData.tags,
        TagGroups.EQUIPMENT,
      );
      const isDumbbellExercise = currentExerciseEquipment.includes(
        WorkoutConstants.EQUIPMENT.DUMBBELL,
      );

      const exerciseWeight = deriveWeightForExercise(
        weight,
        currentExercise.weightType,
        currentExerciseData,
        workoutData.maxValues,
      );

      return (
        <>
          <Text variant="largeTitle">
            {isDumbbellExercise ? t("training.active.2x") : null}
            {exerciseWeight}
          </Text>
          <Text variant="small" color="darkGrey1">
            {t("training.active.weightIn")}
          </Text>
        </>
      );
    } else if (typeof height === "number") {
      return (
        <>
          <Text variant="largeTitle">{height}</Text>
          <Text variant="small" color="darkGrey1">
            {t("training.active.cmHigh")}
          </Text>
        </>
      );
    } else {
      return <Text textAlign="center">{t("training.active.noWeights")}</Text>;
    }
  };

  const renderHeartRate = () => {
    if (!currentExercise || !currentExerciseData) {
      return null;
    }
    const [cardioSkill] = getTagValues(
      currentExerciseData.tags,
      TagGroups.SKILL,
    ).filter((skill) => skill.includes("CARDIO") && skill !== "CARDIO");

    if (typeof cardioSkill === "undefined") {
      return null;
    }

    const heartRateInterval = heartRateBySkillAndBirthday(
      cardioSkill,
      personalData.birthday,
    );

    if (typeof heartRateInterval === "undefined") {
      return null;
    }

    return (
      <>
        <Text variant="largeTitle">
          {`${heartRateInterval.low} - ${heartRateInterval.high}`}
        </Text>
        <Text variant="small" color="darkGrey1">
          {t("training.active.heartRateInterval")}
        </Text>
      </>
    );
  };

  const isCountdownActive =
    isScreenFocused &&
    !isAborted &&
    !videoIsPlaying &&
    !isFullScreen &&
    !isSkipped;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableBox
              key="exercise_information"
              onPress={handleShowExerciseInformation}
              minWidth={36}
              minHeight={36}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Ionicon
                name="information-circle"
                size={28}
                color={colors.black}
              />
            </TouchableBox>
          ),
          headerRight: () => (
            <TouchableBox
              onPress={handleAbortTraining}
              key={"abort_training"}
              minWidth={36}
              minHeight={36}
              alignItems={"center"}
              justifyContent={"center"}
            >
              <Ionicon name="close-circle" size={28} color={colors.black} />
            </TouchableBox>
          ),
        }}
      />
      <Box
        flex={1}
        style={{
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: colors.white }}
          // Ensures input and save button remain visible
          bottomOffset={TRAINING_INPUT_OFFSET}
          keyboardShouldPersistTaps="handled"
        >
          <Box flex={1} backgroundColor="white" justifyContent="flex-start">
            {/* Progress bar */}
            <Box height={4} backgroundColor="lightGrey1">
              <Box
                height="100%"
                backgroundColor="primary"
                width={`${progress * 100}%`}
              />
            </Box>

            {/* Video/Exercise container */}
            <Box backgroundColor="lightGrey2">
              {!!video && (
                <VideoPlayer
                  title={name ?? ""}
                  source={video}
                  setIsFullScreen={setIsFullScreen}
                  setIsVideoPlaying={setVideoIsPlaying}
                  disabled={isAborted || !isScreenFocused}
                />
              )}
            </Box>

            {/* Exercise information */}
            {currentExercise && (
              <Box
                paddingVertical="m"
                borderBottomWidth={1}
                borderBottomColor="lightGrey2"
              >
                {/* Sets */}
                <Box flexDirection="row" minHeight={75}>
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    borderRightWidth={1}
                    borderRightColor="lightGrey2"
                    paddingHorizontal="s"
                  >
                    {currentExercise?.set && (
                      <Box alignItems="center">
                        <Text variant="largeTitle" textAlign="center">
                          {t("training.active.set", {
                            current: currentExercise.set?.[0],
                            total: currentExercise.set?.[1],
                          })}
                        </Text>
                        <Text variant="small" color="darkGrey1">
                          {t("training.active.sets", {
                            count: currentExercise.set?.[1],
                          })}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Reps / Duration */}
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    borderRightWidth={1}
                    borderRightColor="lightGrey2"
                    paddingHorizontal="s"
                    gap="m"
                  >
                    {typeof currentExercise.duration === "number" &&
                      (() => {
                        const { value, unit } = formatExerciseDuration(
                          currentExercise.duration,
                        );
                        return (
                          <Box alignItems="center">
                            <Text variant="largeTitle">{value}</Text>
                            <Text variant="small" color="darkGrey1">
                              {unit}
                            </Text>
                          </Box>
                        );
                      })()}
                    {!isPauseExercise &&
                      typeof currentExercise.repetition === "number" && (
                        <Box alignItems="center">
                          <Text variant="largeTitle">
                            {currentExercise.repetition === -1
                              ? t("training.active.maxReps")
                              : currentExercise.repetition}
                          </Text>
                          <Text variant="small" color="darkGrey1">
                            {t("training.active.repetitions")}
                          </Text>
                        </Box>
                      )}
                  </Box>

                  {/* Heart Rate / Weight / Height  */}
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    paddingHorizontal="s"
                  >
                    {isCardioExercise
                      ? renderHeartRate()
                      : renderWeightOrHeight()}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Training Navigation or Fallback Controls */}
            {currentExercise && (
              <TrainingNavigation
                exerciseId={exerciseId}
                nextExerciseId={nextExercise?.exerciseId}
                duration={
                  isEnduranceExercise
                    ? undefined
                    : currentExercise.duration || 0
                }
                next={advanceToNextExercise}
                feedback={handleFeedback}
                isCountdownActive={isCountdownActive}
                isFirstDurationInTraining={safeExerciseIndex === 0}
                isLastInSet={isLastInSet}
                isFeedbackSkill={isFeedbackSkill && !isEnduranceExercise}
                isCardioExercise={isCardioExercise}
                isLastCardioExercise={isCardioExercise && !hasNextExercise}
                isTest={isTestExercise}
                onSubmitReps={(reps) => saveRepsInput(safeExerciseIndex, reps)}
                pauseToggled={handlePauseToggled}
              />
            )}

            {/* Avoids content being hidden behind TrainingFooter */}
            <Box height={FOOTER_HEIGHT} />
          </Box>
        </KeyboardAwareScrollView>
        {/* Skip button & next exercise preview */}
        <TrainingFooter
          isSkipHidden={
            isTestExercise && typeof currentExercise.duration === "undefined"
          }
          nextExerciseName={
            nextExerciseData?.displayName ?? nextExerciseData?.name
          }
          onSkipPress={handleExerciseSkipped}
        />
      </Box>
    </>
  );
};

export default TrainingActive;
