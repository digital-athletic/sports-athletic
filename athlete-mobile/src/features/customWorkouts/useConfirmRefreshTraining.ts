import { Alert } from "@/common/Alert";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { useTranslation } from "react-i18next";

/** Asks for confirmation, then discards the drawn workouts of the training. */
export const useConfirmRefreshTraining = () => {
  const { t } = useTranslation();
  const discardDrawnWorkouts = useDrawnWorkoutsStore(
    (state) => state.discardDrawnWorkouts,
  );

  return (id: string, name: string) =>
    Alert.alert(
      t("screens.home.additionalTrainings.refreshTrainingTitle"),
      t("screens.home.additionalTrainings.refreshTrainingMessage", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("screens.home.additionalTrainings.refreshTrainingConfirm"),
          onPress: () => discardDrawnWorkouts(id),
        },
      ],
    );
};
