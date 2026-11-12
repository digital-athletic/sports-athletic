import { BackHeader } from "@/common/BackHeader";
import { WorkoutShareButton } from "@/features/training/workoutShare/WorkoutShareButton";
import { Stack } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type TrainingListHeaderProps = {
  onBack: () => void;
};

/** Header for the list-view training screen: title, a discarding back control and the share button. */
export const TrainingListHeader: FC<TrainingListHeaderProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <Stack.Screen
      options={{
        title: t("training.list.title"),
        headerBackVisible: false,
        headerLeft: () => (
          <BackHeader onBack={onBack} testID="training-list-back-button" />
        ),
        headerRight: () => <WorkoutShareButton />,
      }}
    />
  );
};
