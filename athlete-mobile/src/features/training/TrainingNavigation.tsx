import { Ionicon } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type Theme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { useTheme } from "@shopify/restyle";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { isPauseExercise } from "./models/IdTypes";
import { type MaxValuesType } from "./models/MaxValues";
import { TrainingCountdown, TrainingCountdownEvent } from "./TrainingCountdown";
import { TrainingRepetitionInput } from "./TrainingRepetitionInput";

export interface TrainingNavigationProps {
  duration: number | undefined;
  exerciseId: string;
  feedback: (type: "TOO_EASY" | "TOO_HARD" | "SUCCEEDED") => void;
  isCardioExercise: boolean;
  isCountdownActive: boolean;
  isFeedbackSkill: boolean;
  isFirstDurationInTraining: boolean;
  isLastCardioExercise: boolean;
  isLastInSet: boolean;
  isTest: boolean;
  next: (strengthTestMaxValues?: MaxValuesType | null) => void;
  nextExerciseId: string | undefined;
  onSubmitReps: (reps: number) => MaxValuesType | null;
  pauseToggled: (isPaused: boolean) => void;
}

export const TrainingNavigation: FC<TrainingNavigationProps> = ({
  duration,
  next,
  nextExerciseId,
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
}) => {
  const { t } = useTranslation();
  const theme = useTheme<Theme>();

  // State
  const [exerciseEnded, setExerciseEnded] = useState(false);
  const [repsValue, setRepsValue] = useState(0);
  const timerStartRef = useRef(0);

  const hasDuration = typeof duration === "number";

  const isPause = isPauseExercise(exerciseId);

  const resetState = useCallback(() => {
    setExerciseEnded(false);
    setRepsValue(0);
    timerStartRef.current = 0;
  }, []);

  useEffect(() => {
    resetState();
  }, [exerciseId, resetState]);

  // Define handlers before effects
  const handleClickNext = useCallback(
    (strengthTestMaxValues?: MaxValuesType | null) => {
      setExerciseEnded(true);
      next(strengthTestMaxValues);
    },
    [next],
  );

  const handleTimerEvent = useCallback(
    (event: TrainingCountdownEvent) => {
      switch (event) {
        case "advance":
          handleClickNext();
          break;

        case "complete":
          setExerciseEnded(true);
          break;

        case "pause":
        case "play":
          if (!isPause) {
            pauseToggled(event === "play");
          }
          break;
      }
    },
    [handleClickNext, isPause, pauseToggled],
  );

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

  // Only called for strength test exercises (isTest=true, repetition=-1).
  // Pass maxValues directly to avoid React state batching race condition.
  const handleSubmitStrengthTestReps = () => {
    const maxValues = onSubmitReps(repsValue);
    handleClickNext(maxValues);
  };

  const renderNextButton = () => {
    return (
      <Box justifyContent="center" alignItems="center">
        <TouchableBox onPress={() => handleClickNormalButton()}>
          <Ionicon name="checkmark" size={75} color={theme.colors.primary} />
        </TouchableBox>
        <Box opacity={0.2}>
          <Ionicon name="arrow-up" size={22} color={theme.colors.darkGrey2} />
        </Box>
      </Box>
    );
  };

  const renderFeedbackButtons = () => {
    if (
      isFeedbackSkill &&
      (hasDuration ? exerciseEnded : true) &&
      isLastInSet &&
      !isTest
    ) {
      return (
        <Box flexDirection="row" paddingVertical="m">
          <Box flex={1} flexDirection="row">
            <TouchableBox
              flex={3}
              justifyContent="center"
              alignItems="center"
              onPress={() => handleClickNormalButton("too_easy")}
            >
              <Text color="primary">
                {t("training.active.feedback.tooEasy")}
              </Text>
            </TouchableBox>
            <Box flex={2} justifyContent="center" opacity={0.2}>
              <Ionicon
                name="arrow-back"
                size={22}
                color={theme.colors.darkGrey2}
              />
            </Box>
          </Box>
          <Box flex={1} flexDirection="row">
            <Box
              flex={2}
              justifyContent="center"
              alignItems="flex-end"
              opacity={0.2}
            >
              <Ionicon
                name="arrow-forward"
                size={22}
                color={theme.colors.darkGrey2}
              />
            </Box>
            <TouchableBox
              flex={3}
              justifyContent="center"
              alignItems="center"
              onPress={() => handleClickNormalButton("too_hard")}
            >
              <Text color="primary">
                {t("training.active.feedback.tooHard")}
              </Text>
            </TouchableBox>
          </Box>
        </Box>
      );
    }
    return <></>;
  };

  const renderContent = () => {
    if (!hasDuration || exerciseEnded) {
      if (isTest) {
        return (
          <TrainingRepetitionInput
            repsValue={repsValue}
            changeReps={handleChangeReps}
            saveRepsInput={handleSubmitStrengthTestReps}
          />
        );
      }

      const feedbackVisible =
        isFeedbackSkill &&
        (hasDuration ? exerciseEnded : true) &&
        isLastInSet &&
        !isTest;

      return (
        <Box flex={1} alignItems="center" justifyContent="center">
          {renderNextButton()}
          {feedbackVisible && renderFeedbackButtons()}
        </Box>
      );
    }

    return hasDuration ? (
      <TrainingCountdown
        autoAdvance={
          isPause ||
          (isCardioExercise && !isLastCardioExercise) ||
          (isLastInSet && !isFeedbackSkill && !isTest)
        }
        duration={duration}
        exerciseId={exerciseId}
        isActive={isCountdownActive && !exerciseEnded}
        isFirstDurationInTraining={isFirstDurationInTraining}
        nextExerciseId={nextExerciseId}
        onEvent={handleTimerEvent}
      />
    ) : null;
  };

  return (
    <Box width="100%" aspectRatio={1.3}>
      {renderContent()}
    </Box>
  );
};
