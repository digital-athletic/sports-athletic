import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCountdown } from "./hooks/useCountdown";
import { useVoiceCoach } from "./hooks/useVoiceCoach";
import { isPauseExercise } from "./models/IdTypes";

export type TrainingCountdownEvent = "advance" | "complete" | "pause" | "play";

type Props = {
  autoAdvance: boolean;
  duration: number;
  exerciseId: string;
  isActive: boolean;
  isFirstDurationInTraining: boolean;
  nextExerciseId: string | undefined;
  onEvent: (event: TrainingCountdownEvent) => void;
};

export const TrainingCountdown: FC<Props> = ({
  autoAdvance,
  duration,
  exerciseId,
  isActive,
  isFirstDurationInTraining,
  nextExerciseId,
  onEvent,
}) => {
  const { t } = useTranslation();

  const [isPausedState, setIsPausedState] = useState(false);

  // Reset the manual pause whenever a new exercise starts.
  const [prevExerciseId, setPrevExerciseId] = useState(exerciseId);
  if (prevExerciseId !== exerciseId) {
    setPrevExerciseId(exerciseId);
    setIsPausedState(false);
  }

  const isPause = isPauseExercise(exerciseId);
  const isCountdownActive = isActive && !isPausedState;

  const countdown = useCountdown({
    exerciseId,
    duration,
    isActive: isCountdownActive,
    autoAdvance,
    onEvent,
  });

  const hasNextExercise = typeof nextExerciseId === "string";
  const isNextExercisePause = nextExerciseId
    ? isPauseExercise(nextExerciseId)
    : false;

  useVoiceCoach(
    isNextExercisePause,
    hasNextExercise && isCountdownActive,
    countdown,
  );

  const handleTogglePause = useCallback(() => {
    if (!isPause) {
      onEvent?.(isPausedState ? "play" : "pause");
    }
    setIsPausedState(!isPausedState);
  }, [isPause, isPausedState, onEvent]);

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
    <TouchableBox flex={1} flexDirection="row" onPress={handleTogglePause}>
      <Box flex={elapsed} backgroundColor="lightGrey3" zIndex={2} />
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
        {labelText.length > 0 && (
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
    </TouchableBox>
  );
};
