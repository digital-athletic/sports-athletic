import { AwesomeIcon } from "@/common/AwesomeIcon";
import { TrainingNavigation } from "@/features/training/TrainingNavigation";
import { useTrainingStore } from "@/features/training/trainingStore";
import { Logger } from "@/services/Logger";
import { useExercisesStore } from "@/store/exercisesStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@/theme/theme";
import { Video } from "@/video/Video";
import { ScreenMetadata } from "@/video/types";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, Keyboard, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    setTrainingEndTime,
    setExerciseSkipped,
    updateExerciseFeedbackData,
  } = useTrainingStore();

  const { getExerciseById } = useExercisesStore();

  // Local state
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [repsValue, setRepsValue] = useState(0);
  const [isPausedState, setIsPausedState] = useState(false);
  const exerciseStartTimeRef = useRef<number>(Date.now());
  const pauseStartRef = useRef<number>(0);

  const logTrainingEvent = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      if (!activeTraining) return;

      const eventData = {
        type: activeTraining.type,
        ...data,
      };

      if (activeTraining.type.includes("PREV")) {
        Logger.logEvent(`prevention_${eventName}`, eventData);
      }
      Logger.logEvent(eventName, eventData);
    },
    [activeTraining],
  );

  const saveAndNavigateToSuccess = useCallback(
    (aborted: boolean = false) => {
      try {
        // Record end time
        setTrainingEndTime(Date.now());

        // Log completion/abortion
        if (aborted) {
          logTrainingEvent("training_aborted");
        } else {
          logTrainingEvent("training_finished");
        }

        // Navigate to success screen
        router.push({
          pathname: "/training/training-success",
          params: { aborted: aborted.toString() },
        });
      } catch (error) {
        Logger.logError(error as Error);
        Alert.alert(t("common.error"), t("common.error"));
      }
    },
    [logTrainingEvent, router, setTrainingEndTime, t],
  );

  const advanceToNextExercise = () => {
    if (!exerciseList) return;

    if (activeExerciseIndex < exerciseList.length - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
      exerciseStartTimeRef.current = Date.now();
    } else {
      // Training complete
      saveAndNavigateToSuccess(false);
    }
  };

  const handleAbortTraining = useCallback(() => {
    Alert.alert(
      t("screens.trainingDays.abortQuestion"),
      t("screens.trainingDays.abortExplanation"),
      [
        {
          text: t("common.yes"),
          onPress: () => {
            saveAndNavigateToSuccess(true);
          },
        },
        {
          text: t("common.no"),
        },
      ],
    );
  }, [saveAndNavigateToSuccess, t]);

  const handleExerciseSkipped = () => {
    setExerciseSkipped(activeExerciseIndex);
    Logger.logEvent("exercise_skipped", {
      exerciseId: exerciseList?.[activeExerciseIndex]?.exerciseId,
    });
    advanceToNextExercise();
  };

  const handleFeedback = (category: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => {
    updateExerciseFeedbackData(activeExerciseIndex, category);
    Logger.logEvent("exercise_feedback", {
      category,
      exerciseId: exerciseList?.[activeExerciseIndex]?.exerciseId,
    });
    advanceToNextExercise();
  };

  const handleChangeReps = (value: string) => {
    const num = Number.parseInt(value) || 0;
    setRepsValue(num);
  };

  const handleSaveRepsInput = () => {
    try {
      Keyboard.dismiss();

      // Validate input is numeric
      if (repsValue <= 0) {
        Alert.alert(t("common.error"), t("common.error"));
        return false;
      }

      // TODO: Save test result with max value calculation via Epley formula
      Logger.logEvent("test_repetition_value_saved", { value: repsValue });
      setRepsValue(0);
      return true;
    } catch (error) {
      Logger.logError(error as Error);
      Alert.alert(t("common.error"), t("common.error"));
      return false;
    }
  };

  const handlePauseToggled = (wasPaused: boolean) => {
    if (wasPaused) {
      // Resume: add pause duration to tracking
      const pauseDuration = Date.now() - pauseStartRef.current;
      exerciseStartTimeRef.current += pauseDuration;
      setIsPausedState(false);
    } else {
      // Pause: mark start of pause
      pauseStartRef.current = Date.now();
      setIsPausedState(true);
    }
  };

  const handleChangeVideoProperties = (
    screen: ScreenMetadata,
    _videoIsPlaying: boolean,
  ) => {
    setIsFullScreen(screen.isFullScreen);
    setVideoIsPlaying(_videoIsPlaying);
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

  // Log training started
  useEffect(() => {
    logTrainingEvent("training_started");
    exerciseStartTimeRef.current = Date.now();
  }, [logTrainingEvent]);

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

  const currentExercise = exerciseList[activeExerciseIndex];
  const exerciseId = currentExercise?.exerciseId;
  const nextExerciseIndex = activeExerciseIndex + 1;
  const hasNextExercise = nextExerciseIndex < exerciseList.length;

  const progress = activeExerciseIndex / exerciseList.length;
  const isTestExercise = currentExercise?.repetition === -1;
  const isCardioExercise = currentExercise?.skill?.includes("CARDIO");
  const isPauseExercise = exerciseId === 999999;
  const hasDuration = !!currentExercise?.duration;
  const isLastInSet = currentExercise?.set?.[0] === currentExercise?.set?.[1];

  const exerciseData = getExerciseById(exerciseId);
  const nextExerciseData = hasNextExercise
    ? getExerciseById(exerciseList[nextExerciseIndex].exerciseId)
    : undefined;

  const picture = isPauseExercise
    ? nextExerciseData?.picture
    : exerciseData?.picture;
  const name = isPauseExercise ? nextExerciseData?.name : exerciseData?.name;

  const nextDisplayName = t("training.active.nextExercise", {
    exerciseName: hasNextExercise
      ? (nextExerciseData?.displayName ?? nextExerciseData?.name)
      : t("training.active.finished"),
  });

  const displayName = isPauseExercise
    ? nextDisplayName
    : (exerciseData?.displayName ?? exerciseData?.name);
  const video = isPauseExercise ? nextExerciseData?.video : exerciseData?.video;

  const isExerciseInformationVisible =
    typeof exerciseId === "number" && !isPauseExercise;

  const handleShowExerciseInformation = () => {
    if (!isExerciseInformationVisible) return;

    router.navigate({
      pathname: "/training/exercise-information",
      params: {
        exerciseId,
      },
    });
  };

  return (
    <Box
      flex={1}
      style={{
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Box flex={1} style={{ paddingBottom: insets.bottom }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
        >
          <Box
            flex={1}
            backgroundColor="white"
            justifyContent="flex-start"
            paddingTop="m"
          >
            {/* Progress bar */}
            <Box height={4} backgroundColor="lightGrey1">
              <Box
                height="100%"
                backgroundColor="primary"
                width={`${progress * 100}%`}
              />
            </Box>

            {/* Video/Exercise container */}

            <Box
              flex={1}
              justifyContent="center"
              alignItems="center"
              backgroundColor="lightGrey2"
              overflow="hidden"
            >
              <Video
                isPause={isPauseExercise}
                pictureName={picture ?? ""}
                title={name ?? ""}
                videoName={video ?? ""}
                videoTitle={displayName ?? ""}
                changeVideoProperties={handleChangeVideoProperties}
                playButtonDisabled={isPausedState}
                size="Big"
                fullScreenDisabled={false}
              />
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                marginHorizontal="m"
                marginVertical="s"
                flexDirection="row"
                justifyContent="space-between"
              >
                {isExerciseInformationVisible ? (
                  <TouchableBox
                    key="exercise_information"
                    onPress={handleShowExerciseInformation}
                  >
                    <AwesomeIcon
                      name="info-circle"
                      size={24}
                      color={colors.white}
                    />
                  </TouchableBox>
                ) : (
                  <Box />
                )}

                <TouchableBox
                  onPress={handleAbortTraining}
                  key={"abort_training"}
                >
                  <AwesomeIcon
                    name="times-circle"
                    size={24}
                    color={colors.white}
                  />
                </TouchableBox>
              </Box>
            </Box>

            {/* Exercise information */}
            {!isFullScreen && currentExercise && (
              <Box padding="m" gap="m">
                {/* Sets */}
                <Box flexDirection="row">
                  <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    borderRightWidth={1}
                    borderRightColor="lightGrey2"
                  >
                    {currentExercise?.set && (
                      <Box alignItems="center">
                        <Text variant="title" textAlign="center">
                          {t("training.active.set", {
                            current: currentExercise.set[0],
                            total: currentExercise.set[1],
                          })}
                        </Text>
                        <Text variant="small" color="darkGrey1">
                          {t("training.quickstart.QUICKSTART_WARM_UP")}
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
                  >
                    {typeof currentExercise.duration === "number" && (
                      <Box alignItems="center">
                        <Text variant="title">{currentExercise.duration}</Text>
                        <Text variant="small" color="darkGrey1">
                          sec
                        </Text>
                      </Box>
                    )}
                    {typeof currentExercise.repetition === "number" && (
                      <Box alignItems="center">
                        <Text variant="title">
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

                  {/* TODO: Heart rate / Weight */}
                  <Box flex={1} justifyContent="center" alignItems="center">
                    <Text variant="cardTitle">
                      {t("training.active.noWeights")}
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Training Navigation or Fallback Controls */}
            {!isFullScreen && currentExercise && (
              <TrainingNavigation
                exerciseId={exerciseId}
                hasDuration={hasDuration}
                duration={currentExercise.duration || 0}
                next={advanceToNextExercise}
                skip={handleExerciseSkipped}
                isPause={isPauseExercise}
                feedback={handleFeedback}
                videoIsPlaying={videoIsPlaying}
                videoIsFullScreen={isFullScreen}
                isFirstDurationInTraining={activeExerciseIndex === 0}
                isLastInSet={isLastInSet}
                isFeedbackSkill={true}
                isCardioExercise={isCardioExercise}
                isLastCardioExercise={isCardioExercise && !hasNextExercise}
                isTest={isTestExercise}
                repsValue={repsValue}
                changeReps={handleChangeReps}
                saveRepsInput={handleSaveRepsInput}
                pauseToggled={handlePauseToggled}
              />
            )}

            {/* Fallback controls for fullscreen */}
            {isFullScreen && (
              <Box padding="m" gap="m">
                <Button variant="primary" onPress={advanceToNextExercise}>
                  {hasNextExercise ? t("common.next") : t("common.confirm")}
                </Button>
                <Button variant="secondary" onPress={handleAbortTraining}>
                  {t("common.cancel")}
                </Button>
              </Box>
            )}
            {/* Next exercise preview */}
            <Box padding="m" backgroundColor="lightGrey1" borderRadius="m">
              <Text marginBottom="xs" fontWeight="bold">
                {nextDisplayName}
              </Text>
            </Box>
          </Box>
        </TouchableOpacity>
      </Box>
    </Box>
  );
};

export default TrainingActive;
