import { TagGroups } from "@/constants/tagGroups";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { type MaxValuesType } from "@/features/training/models/MaxValues";
import { deriveEntryWeight } from "@/features/training/utils/workoutUtils";
import { type ExerciseType } from "@/schemas/exercise.schema";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { Text } from "@/theme/Text";
import { getTagValues } from "@/utils/tagUtils";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  exercise: UserExerciseDataType | undefined;
  exerciseData: ExerciseType | undefined;
  maxValues: MaxValuesType;
};

export const ExerciseWeightOrHeightDisplay: FC<Props> = ({
  exercise,
  exerciseData,
  maxValues,
}) => {
  const { t } = useTranslation();

  if (!exercise || !exerciseData) {
    return null;
  }

  const weight = exercise.weight;
  const height = exercise.height;

  // Weight information (truthy check filters out NaN, undefined, null, 0)
  if (weight) {
    const currentExerciseEquipment = getTagValues(
      exerciseData.tags,
      TagGroups.EQUIPMENT,
    );
    const isDumbbellExercise = currentExerciseEquipment.includes(
      WorkoutConstants.EQUIPMENT.DUMBBELL,
    );

    const exerciseWeight = deriveEntryWeight(
      { weight, weightType: exercise.weightType, skill: exercise.skill },
      exerciseData,
      maxValues,
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
