import { HeaderIconButton } from "@/common/HeaderIconButton";
import { Stack } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export type TrainingListHeaderProps = {
  onAbort: () => void;
};

/** Header for the list-view training screen: title plus an abort control. */
export const TrainingListHeader: FC<TrainingListHeaderProps> = ({
  onAbort,
}) => {
  const { t } = useTranslation();

  return (
    <Stack.Screen
      options={{
        title: t("training.list.title"),
        headerBackVisible: false,
        headerRight: () => (
          <HeaderIconButton
            iconName="close-circle"
            onPress={onAbort}
            accessibilityLabel={t("training.active.a11y.abortTraining")}
          />
        ),
      }}
    />
  );
};
