import { HeaderIconButton } from "@/common/HeaderIconButton";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import { OwnTrainingsList } from "@/features/customWorkouts/OwnTrainingsList";
import { useImportCustomWorkout } from "@/features/customWorkouts/useImportCustomWorkout";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AdditionalTrainingWorkoutsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { importCustomWorkout, importing } = useImportCustomWorkout();
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const title =
    typeof params.title === "string"
      ? params.title
      : t("screens.home.additionalTrainings.title");
  const isOwnSource = params.source === "own";
  const showsHeaderImport =
    isOwnSource && listWorkoutsForTeam(workoutsById, null).length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerRight: showsHeaderImport
            ? () => (
                <HeaderIconButton
                  iconName="add-circle"
                  onPress={importCustomWorkout}
                  disabled={importing}
                  accessibilityLabel={t(
                    "screens.home.additionalTrainings.importTraining",
                  )}
                />
              )
            : undefined,
        }}
      />
      {isOwnSource ? (
        <OwnTrainingsList
          onImport={importCustomWorkout}
          importing={importing}
        />
      ) : (
        <EmptyTrainingListMessage />
      )}
    </>
  );
}
