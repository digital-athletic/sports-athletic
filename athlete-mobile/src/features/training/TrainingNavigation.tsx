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
import { useCountdown } from "./hooks/useCountdown";
import { useVoiceCoach } from "./hooks/useVoiceCoach";

export interface TrainingNavigationProps {
  exerciseId: number;
  duration: number | undefined;
  next: () => void;
  skip: () => void;
  isPause: boolean;
  isNextExercisePause: boolean;
  isCountdownActive: boolean;
  hasNextExercise: boolean;
  feedback: (type: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => void;
  isFirstDurationInTraining: boolean;
  isLastInSet: boolean;
  isFeedbackSkill: boolean;
  isCardioExercise: boolean;
  isLastCardioExercise: boolean;
  isTest: boolean;
  onSubmitReps: (reps: number) => void;
  pauseToggled: (isPaused: boolean) => void;
  onTestInputFocusChange?: (isFocused: boolean) => void;
  isTestInputFocused?: boolean;
}

const AnimatedIcon = Animated.createAnimatedComponent(Ionicon);
const multiplier = 2;
const normalText = 16;
const bigText = 24;

export const TrainingNavigation: FC<TrainingNavigationProps> = ({
  duration,
  next,
  skip,
  isPause,
  hasNextExercise,
  isNextExercisePause,
  isCountdownActive,
  feedback,
  isFirstDurationInTraining,
  isLastInSet,
  isFeedbackSkill,
  isCardioExercise,
  isLastCardioExercise,
  isTest,
  onSubmitReps,
  pauseToggled,
  exerciseId,
  onTestInputFocusChange,
  isTestInputFocused,
}) => {
  const { t } = useTranslation();
  const theme = useTheme<Theme>();

  // State
  const [exerciseEnded, setExerciseEnded] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [repsValue, setRepsValue] = useState(0);
  const timerStartRef = useRef(0);
  const lastNavEventFiredRef = useRef(0);
  const dxRef = useRef(new Animated.Value(0));
  const dyRef = useRef(new Animated.Value(0));
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(
    null,
  );

  const hasDuration = typeof duration === "number";
  const isTimerActive =
    isCountdownActive && hasDuration && !exerciseEnded && !isPausedState;

  const countdown = useCountdown({
    exerciseId,
    duration,
    isActive: isTimerActive,
    autoAdvance:
      isPause ||
      (isCardioExercise && !isLastCardioExercise) ||
      (isLastInSet && !isFeedbackSkill && !isTest),
    onAutoAdvance: () => {
      handleClickNext();
    },
    onComplete: () => {
      setExerciseEnded(true);
    },
  });
  useVoiceCoach(
    isNextExercisePause,
    hasNextExercise && isTimerActive,
    countdown,
  );

  const resetState = () => {
    setExerciseEnded(false);
    setIsPausedState(false);
    setRepsValue(0);
    timerStartRef.current = 0;
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
      if (isLastInSet && !isTest) {
        if (identification === "too_easy") {
          feedback("TOO_EASY");
        } else if (identification === "too_hard") {
          feedback("TOO_HARD");
        } else {
          feedback("SUCCEEDED");
        }
      }
      handleClickNext();
    },
    [isLastInSet, isTest, handleClickNext, feedback],
  );

  const handleChangeReps = (value: string) => {
    const num = Number.parseInt(value) || 0;
    setRepsValue(num);
  };

  const handleSubmitReps = () => {
    onSubmitReps(repsValue);
    handleClickNext();
  };

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

  const handleClickSkip = () => {
    skip();
    resetState();
  };

  const handleTogglePause = () => {
    if (!isPause) {
      pauseToggled(!isPausedState);
    }
    setIsPausedState(!isPausedState);
  };

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

  const renderTimeProgress = (duration: number) => {
    const remainingInt =
      typeof countdown === "number" ? Math.floor(countdown) : -1;
    const elapsed = Math.max(duration - remainingInt, 0);
    const min = Math.floor(remainingInt / 60);
    const sec = remainingInt - min * 60;
    const minText = remainingInt < 0 ? "--" : ("0" + min).slice(-2);
    const secText = remainingInt < 0 ? "--" : ("0" + sec).slice(-2);
    const timeText = `${minText}:${secText}`;

    let countdownColorKey: "primary" | "white" = "primary";
    let labelText = "";
    let backgroundColor: "white" | "primary" = "white";

    if (isPause) {
      // Pause exercise
      backgroundColor = "primary";
      countdownColorKey = "white";
      labelText = t("training.active.pause.label");
    } else if (isPausedState) {
      // Manual pause
      backgroundColor = "primary";
      countdownColorKey = "white";
      labelText = t("training.active.pause.goOn");
    } else if (isFirstDurationInTraining && elapsed < 4) {
      labelText = t("training.active.controls.clickToPause");
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
          flex={duration - remainingInt}
          backgroundColor="lightGrey3"
          zIndex={2}
        />
        <Box flex={remainingInt} backgroundColor={backgroundColor} zIndex={2} />
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
            {timeText}
          </Text>
        </Box>
      </TouchableOpacity>
    );
  };

  const renderNextButton = () => {
    const navValues = getInterpolations();
    return (
      <>
        <TouchableOpacity
          onPress={() => handleClickNormalButton()}
          style={{
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
      </>
    );
  };

  const renderFeedbackButtons = () => {
    if (
      isFeedbackSkill &&
      (hasDuration ? exerciseEnded : true) &&
      !isPausedState &&
      isLastInSet &&
      !isTest
    ) {
      const navValues = getInterpolations();
      return (
        <Box flexDirection="row">
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
    return <></>;
  };

  const renderContent = () => {
    if (!panResponderRef.current) return <Box />;

    if (!hasDuration || exerciseEnded) {
      if (isTest) {
        return (
          <Box flex={6}>
            <TrainingRepetitionInput
              repsValue={repsValue}
              changeReps={handleChangeReps}
              saveRepsInput={handleSubmitReps}
              onInputFocusChange={onTestInputFocusChange}
            />
          </Box>
        );
      }

      return (
        <Box
          flex={6}
          flexDirection="row"
          alignItems={"center"}
          style={{
            backgroundColor: "rgba(0,0,0,0)",
            ...panResponderRef.current.panHandlers,
          }}
        >
          <Box flex={1} flexDirection={"column"}>
            {renderNextButton()}
            {renderFeedbackButtons()}
          </Box>
        </Box>
      );
    }

    return hasDuration ? (
      <Box flex={6}>{renderTimeProgress(duration)}</Box>
    ) : null;
  };

  const renderSkipButton = () => {
    if ((!hasDuration || exerciseEnded) && isTest) {
      return (
        <Box
          flex={1}
          justifyContent="center"
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
    <Box flex={2} backgroundColor="white">
      {renderContent()}
      {!isTestInputFocused && renderSkipButton()}
    </Box>
  );
};
