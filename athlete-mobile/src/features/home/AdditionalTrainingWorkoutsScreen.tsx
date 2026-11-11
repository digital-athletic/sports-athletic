import { HeaderIconButton } from "@/common/HeaderIconButton";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import { OwnTrainingsList } from "@/features/customWorkouts/OwnTrainingsList";
import { TeamTrainingsList } from "@/features/customWorkouts/TeamTrainingsList";
import { useImportCustomWorkout } from "@/features/customWorkouts/useImportCustomWorkout";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import IconCirclePlus from "@tabler/icons-react-native/IconCirclePlus";

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
  const teamId =
    params.source === "team" && typeof params.teamId === "string"
      ? params.teamId
      : "";
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
                  icon={IconCirclePlus}
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
      ) : teamId ? (
        <TeamTrainingsList key={teamId} teamId={teamId} />
      ) : (
        <EmptyTrainingListMessage />
      )}
    </>
  );
}
