import { ExerciseHeartRateDisplay } from "@/features/training/ExerciseHeartRateDisplay";
import { ExerciseWeightOrHeightDisplay } from "@/features/training/ExerciseWeightOrHeightDisplay";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

const formatExerciseDuration = (
  seconds: number,
): { value: string; unit: string } => {
  if (seconds < 60) return { value: String(seconds), unit: "sec" };
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return { value: String(mins), unit: "min" };
  return { value: `${mins} min`, unit: `${secs} sec` };
};

type Props = {
  exercise: UserExerciseDataType | undefined;
  exerciseData: ExerciseType | undefined;
  isPauseExercise: boolean;
  isCardioExercise: boolean;
  maxValues: MaxValuesType;
  birthday: string;
};

export const ExerciseInfoPanel: FC<Props> = ({
  exercise,
  exerciseData,
  isPauseExercise,
  isCardioExercise,
  maxValues,
  birthday,
}) => {
  const { t } = useTranslation();

  if (!exercise) {
    return null;
  }

  return (
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
          {exercise?.set && (
            <Box alignItems="center">
              <Text variant="largeTitle" textAlign="center">
                {t("training.active.set", {
                  current: exercise.set?.[0],
                  total: exercise.set?.[1],
                })}
              </Text>
              <Text variant="small" color="darkGrey1">
                {t("training.active.sets", {
                  count: exercise.set?.[1],
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
          {typeof exercise.duration === "number" &&
            (() => {
              const { value, unit } = formatExerciseDuration(exercise.duration);
              return (
                <Box alignItems="center">
                  <Text variant="largeTitle">{value}</Text>
                  <Text variant="small" color="darkGrey1">
                    {unit}
                  </Text>
                </Box>
              );
            })()}
          {!isPauseExercise && typeof exercise.repetition === "number" && (
            <Box alignItems="center">
              <Text variant="largeTitle">
                {exercise.repetition === -1
                  ? t("training.active.maxReps")
                  : exercise.repetition}
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
          {isCardioExercise ? (
            <ExerciseHeartRateDisplay
              exerciseData={exerciseData}
              birthday={birthday}
            />
          ) : (
            <ExerciseWeightOrHeightDisplay
              exercise={exercise}
              exerciseData={exerciseData}
              maxValues={maxValues}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};
