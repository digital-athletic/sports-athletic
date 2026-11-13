import { Alert } from "@/common/Alert";
import { HeaderIconButton } from "@/common/HeaderIconButton";
import { getAllExercises } from "@/data/exerciseRegistry";
import { useTrainingStore } from "@/features/training/trainingStore";
import { Logger } from "@/services/Logger";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import IconShare2 from "@tabler/icons-react-native/IconShare2";
import { type UserExerciseDataType } from "@/schemas/sync.schema";
import { type TFunction } from "i18next";
import { useLocalSearchParams } from "expo-router";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { shareWorkoutText } from "./shareWorkoutText";
import { buildWorkoutText } from "./workoutText";

type TrainingParams = { weekday?: string; place?: string };

// The place decides which bench and ball the equipment list names.
const resolvePlace = ({ place, weekday }: TrainingParams): string => {
  if (place) return place;
  const { trainingDays } = useTrainingScheduleStore.getState();
  return (weekday && trainingDays[parseInt(weekday)]?.place) || "HOME";
};

/** Alerts the athlete instead of throwing when the text cannot be shared. */
const shareWorkout = async (
  exerciseList: UserExerciseDataType[],
  params: TrainingParams,
  t: TFunction,
  locale: string,
) => {
  try {
    const text = buildWorkoutText(
      {
        exerciseList,
        exercises: getAllExercises(),
        place: resolvePlace(params),
        maxValues: useUserWorkoutStore.getState().workoutData.maxValues,
        date: new Date().toLocaleDateString(locale),
      },
      t,
    );
    if ((await shareWorkoutText(text)) === "copied") {
      Alert.alert(t("training.list.share.copied"));
    }
  } catch (error) {
    Logger.logError(
      error instanceof Error ? error : new Error("Workout share failed"),
    );
    Alert.alert(t("common.error"));
  }
};

/** Header button that shares the running workout as plain text. */
export const WorkoutShareButton: FC = () => {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<TrainingParams>();
  const [isSharing, setIsSharing] = useState(false);

  const share = async () => {
    const { exerciseList } = useTrainingStore.getState();
    if (!exerciseList) return;
    setIsSharing(true);
    await shareWorkout(exerciseList, params, t, i18n.language);
    setIsSharing(false);
  };

  return (
    <HeaderIconButton
      icon={IconShare2}
      onPress={share}
      disabled={isSharing}
      accessibilityLabel={t("training.list.share.label")}
      testID="workout-share-button"
    />
  );
};
