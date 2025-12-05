import { AwesomeIcon } from "@/common/AwesomeIcon";
import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type Theme } from "@/theme/theme";
import { useTheme } from "@shopify/restyle";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  type GestureResponderEvent,
} from "react-native";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";
import { useVoiceCoach } from "./hooks/useVoiceCoach";

export interface TrainingNavigationProps {
  exerciseId: number;
  hasDuration: boolean;
  duration: number;
  next: () => void;
  skip: () => void;
  isPause: boolean;
  feedback: (type: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => void;
  videoIsPlaying: boolean;
  videoIsFullScreen: boolean;
  isFirstDurationInTraining: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  isCardioExercise: boolean;
  isLastCardioExercise: boolean;
  isTest: boolean;
  repsValue: number;
  changeReps: (value: string) => void;
  saveRepsInput: (value: string) => boolean;
  pauseToggled: (isPaused: boolean) => void;
}

const AnimatedIcon = Animated.createAnimatedComponent(Ionicon);
const multiplier = 2;
const normalText = 16;
const bigText = 24;
const UPDATE_CYCLE_TIME = 300;

export const TrainingNavigation: FC<TrainingNavigationProps> = ({
  hasDuration,
  duration,
  next,
  skip,
  isPause,
  feedback,
  videoIsPlaying,
  videoIsFullScreen,
  isFirstDurationInTraining,
  isLastInSet,
  isFeedbackSkill,
  isCardioExercise,
  isLastCardioExercise,
  isTest,
  repsValue,
  changeReps,
  saveRepsInput,
  pauseToggled,
  exerciseId,
}) => {
  const { t } = useTranslation();
  const theme = useTheme<Theme>();

  // State
  const [remaining, setRemaining] = useState(-1);
  const [exerciseEnded, setExerciseEnded] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const startRef = useRef(0);
  const lastNavEventFiredRef = useRef(0);
  const dxRef = useRef(new Animated.Value(0));
  const dyRef = useRef(new Animated.Value(0));
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(
    null,
  );

  const { playCountdownToStart, playCountdownToPause, stopVoiceCoach } =
    useVoiceCoach();

  const resetState = () => {
    setRemaining(-1);
    setExerciseEnded(false);
    setIsPausedState(false);
    startRef.current = 0;
    lastNavEventFiredRef.current = 0;
    dxRef.current.setValue(0);
    dyRef.current.setValue(0);
  };

  // Define handlers before effects
  const handleClickNext = useCallback(async () => {
    next();
    resetState();
  }, [next]);

  const handleClickNormalButton = useCallback(
    async (identification?: "too_easy" | "too_hard") => {
      setRemaining(-1);
      if (isLastInSet && !isTest) {
        if (identification === "too_easy") {
          feedback("TOO_EASY");
        } else if (identification === "too_hard") {
          feedback("TOO_HARD");
        } else {
          feedback("SUCCEEDED");
        }
      }
      next();
      dxRef.current.setValue(0);
      dyRef.current.setValue(0);
    },
    [isLastInSet, isTest, feedback, next],
  );

  // Pan responder initialization
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return !(gestureState.dx === 0 && gestureState.dy === 0);
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState) => {
        if (evt.nativeEvent.timestamp - lastNavEventFiredRef.current > 1000) {
          dxRef.current.setValue(gestureState.dx);
          dyRef.current.setValue(gestureState.dy);

          if (!isTest) {
            if (gestureState.dy < -100) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              handleClickNormalButton();
            } else if (gestureState.dx < -80 && isLastInSet) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              handleClickNormalButton("too_easy");
            } else if (gestureState.dx > 80 && isLastInSet) {
              lastNavEventFiredRef.current = evt.nativeEvent.timestamp;
              handleClickNormalButton("too_hard");
            }
          }
        }
      },
      onPanResponderRelease: () => {
        dxRef.current.setValue(0);
        dyRef.current.setValue(0);
      },
    });
  }, [isTest, isLastInSet, handleClickNormalButton]);

  useEffect(() => {
    resetState();
  }, [exerciseId]);

  const handleClickSkip = () => {
    skip();
    resetState();
  };

  const handleTogglePause = () => {
    if (isPausedState && videoIsPlaying) {
      stopVoiceCoach();
    }
    if (!isPause) {
      pauseToggled(!isPausedState);
    }
    setIsPausedState(!isPausedState);
  };

  // Replace the timer useEffect with:
  useEffect(() => {
    if (!hasDuration || !duration) {
      return;
    }

    let startTime = startRef.current || Date.now();
    let timerInterval: ReturnType<typeof setInterval>;

    const tick = () => {
      // Pause: freeze progress by adjusting start time
      if (isPausedState || videoIsPlaying || videoIsFullScreen) {
        const elapsed = duration - Math.max(remaining, 0);
        startTime = Date.now() - elapsed * 1000;
        return;
      }

      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      const newRemaining = Math.max(0, duration - elapsedSecs);

      setRemaining(newRemaining);

      // Voice cues at specific times
      if (isPause && newRemaining === 6) {
        playCountdownToStart();
      } else if (!isPause && newRemaining === 4) {
        playCountdownToPause();
      }

      // Exercise complete
      if (newRemaining === 0) {
        setExerciseEnded(true);
        clearInterval(timerInterval);

        // Auto-advance conditions
        const shouldAutoAdvance =
          isPause ||
          (isCardioExercise && !isLastCardioExercise) ||
          (isLastInSet && !isFeedbackSkill && !isTest);

        if (shouldAutoAdvance) {
          handleClickNext();
        }
      }
    };

    startRef.current = startTime;
    timerInterval = setInterval(tick, UPDATE_CYCLE_TIME);

    return () => clearInterval(timerInterval);
  }, [
    hasDuration,
    duration,
    isPausedState,
    videoIsPlaying,
    videoIsFullScreen,
    isPause,
    isCardioExercise,
    isLastCardioExercise,
    isLastInSet,
    isFeedbackSkill,
    isTest,
    remaining,
    playCountdownToStart,
    playCountdownToPause,
    handleClickNext,
  ]);

  const getInterpolations = () => {
    return {
      up: {
        opacity: dyRef.current.interpolate({
          inputRange: [-101, -100, -1, 0],
          outputRange: [1.0, 1.0, 0.2, 0.2],
        }),
        textSize: dyRef.current.interpolate({
          inputRange: [-101, -100, -1, 0],
          outputRange: [
            bigText * multiplier,
            bigText * multiplier,
            bigText,
            bigText,
          ],
        }),
        iconSize: dyRef.current.interpolate({
          inputRange: [-101, -100, -1, 0],
          outputRange: [100, 100, 75, 75],
        }),
      },
      down: {
        opacity: dyRef.current.interpolate({
          inputRange: [-1, 0, 100, 101],
          outputRange: [0.2, 0.2, 1.0, 1.0],
        }),
        textSize: dyRef.current.interpolate({
          inputRange: [9, 10, 80, 81],
          outputRange: [
            normalText,
            normalText,
            normalText * multiplier,
            normalText * multiplier,
          ],
        }),
      },
      left: {
        opacity: dxRef.current.interpolate({
          inputRange: [-81, -80, -1, 0],
          outputRange: [1.0, 1.0, 0.2, 0.2],
        }),
        textSize: dxRef.current.interpolate({
          inputRange: [-81, -80, -1, 0],
          outputRange: [
            normalText * multiplier,
            normalText * multiplier,
            normalText,
            normalText,
          ],
        }),
      },
      right: {
        opacity: dxRef.current.interpolate({
          inputRange: [-1, 0, 80, 81],
          outputRange: [0.2, 0.2, 1.0, 1.0],
        }),
        textSize: dxRef.current.interpolate({
          inputRange: [-1, 0, 80, 81],
          outputRange: [
            normalText,
            normalText,
            normalText * multiplier,
            normalText * multiplier,
          ],
        }),
      },
    };
  };

  const renderTimeProgress = () => {
    const secondsPassed = Math.floor((Date.now() - startRef.current) / 1000);
    const min = Math.floor(remaining / 60);
    const sec = remaining - min * 60;
    const minText = remaining < 0 ? "--" : ("0" + min).slice(-2);
    const secText = remaining < 0 ? "--" : ("0" + sec).slice(-2);
    let displayText = `${minText}:${secText}`;

    let countdownColorKey: "primary" | "white" = "primary";
    let labelText = "";

    if (isPausedState) {
      labelText = t("training.active.pause.goOn");
      countdownColorKey = "white";
    } else if (isFirstDurationInTraining && secondsPassed < 4) {
      labelText = t("training.active.controls.clickToPause");
      countdownColorKey = "white";
    }

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: "row",
          position: "relative",
        }}
        onPress={handleTogglePause}
      >
        <Box
          flex={duration - remaining}
          backgroundColor="lightGrey3"
          zIndex={2}
        />
        <Box
          flex={remaining}
          backgroundColor={isPausedState ? "primary" : "white"}
          zIndex={2}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          padding="l"
          justifyContent="center"
          alignItems="center"
          zIndex={99}
          style={{ backgroundColor: "transparent" }}
        >
          {labelText && (
            <Text color={countdownColorKey} variant="body" marginBottom="s">
              {labelText}
            </Text>
          )}
          <Text
            color={countdownColorKey}
            fontSize={32}
            fontWeight="300"
            textAlign="center"
          >
            {displayText}
          </Text>
        </Box>
      </TouchableOpacity>
    );
  };

  const renderNextButton = () => {
    const navValues = getInterpolations();
    return (
      <Box flex={4} alignItems="center">
        <TouchableOpacity
          onPress={() => handleClickNormalButton()}
          style={{
            width: 150,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AnimatedIcon
            name="checkmark"
            size={navValues.up.iconSize as any}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <Animated.View
          style={{
            flex: 2,
            justifyContent: "center",
            alignItems: "center",
            opacity: navValues.up.opacity,
          }}
        >
          <AwesomeIcon
            name="arrow-up"
            size={22}
            color={theme.colors.darkGrey2}
          />
        </Animated.View>
      </Box>
    );
  };

  const renderFeedbackButtons = () => {
    if (!isPausedState && isLastInSet && isFeedbackSkill && !isTest) {
      const navValues = getInterpolations();
      return (
        <Box flex={2} flexDirection="row">
          <Box flex={1} flexDirection="row">
            <TouchableOpacity
              style={{
                flex: 3,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => handleClickNormalButton("too_easy")}
            >
              <Animated.Text
                style={{
                  fontSize: navValues.left.textSize as any,
                  color: theme.colors.primary,
                }}
              >
                {t("training.active.feedback.tooEasy")}
              </Animated.Text>
            </TouchableOpacity>
            <Animated.View
              style={{
                flex: 2,
                justifyContent: "center",
                alignItems: "flex-start",
                opacity: navValues.left.opacity,
              }}
            >
              <AwesomeIcon
                name="arrow-left"
                size={22}
                color={theme.colors.darkGrey2}
              />
            </Animated.View>
          </Box>
          <Box flex={1} flexDirection="row">
            <Animated.View
              style={{
                flex: 2,
                justifyContent: "center",
                alignItems: "flex-end",
                opacity: navValues.right.opacity,
              }}
            >
              <AwesomeIcon
                name="arrow-right"
                size={22}
                color={theme.colors.darkGrey2}
              />
            </Animated.View>
            <TouchableOpacity
              style={{
                flex: 3,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => handleClickNormalButton("too_hard")}
            >
              <Animated.Text
                style={{
                  fontSize: navValues.right.textSize as any,
                  color: theme.colors.primary,
                }}
              >
                {t("training.active.feedback.tooHard")}
              </Animated.Text>
            </TouchableOpacity>
          </Box>
        </Box>
      );
    }
    return <Box flex={2} />;
  };

  const renderContent = () => {
    if (!panResponderRef.current) return <Box />;

    if (!hasDuration || exerciseEnded) {
      if (isTest) {
        return (
          <Box flex={6}>
            <TrainingRepetitionInput
              repsValue={repsValue}
              changeReps={changeReps}
              saveRepsInput={handleClickNext}
            />
          </Box>
        );
      }

      return (
        <Box
          flex={6}
          alignSelf="stretch"
          style={{
            backgroundColor: "rgba(0,0,0,0)",
            ...panResponderRef.current.panHandlers,
          }}
        >
          <Box flex={6} flexDirection="row" justifyContent="center">
            {renderNextButton()}
          </Box>
          {renderFeedbackButtons()}
          <Box flex={2} />
        </Box>
      );
    }

    return <Box flex={6}>{renderTimeProgress()}</Box>;
  };

  const renderSkipButton = () => {
    if ((!hasDuration || exerciseEnded) && isTest) {
      return (
        <Box
          flex={1}
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          backgroundColor="lightGrey1"
          borderTopWidth={1}
          borderTopColor="lightGrey2"
        />
      );
    }

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.lightGrey1,
          borderTopWidth: 1,
          borderTopColor: theme.colors.lightGrey2,
        }}
        onPress={handleClickSkip}
      >
        <Ionicon name="play-forward" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <Box flex={1} backgroundColor="white">
      {renderContent()}
      {renderSkipButton()}
    </Box>
  );
};
