import { HeaderIconButton } from "@/common/HeaderIconButton";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import { OwnTrainingsList } from "@/features/customWorkouts/OwnTrainingsList";
import { TeamTrainingsList } from "@/features/customWorkouts/TeamTrainingsList";
import { useImportCustomWorkout } from "@/features/customWorkouts/useImportCustomWorkout";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Box } from "@/theme/Box";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import IconCirclePlusFilled from "@tabler/icons-react-native/IconCirclePlusFilled";
import IconSparkles from "@tabler/icons-react-native/IconSparkles";

const openGenerateTraining = () => router.push("/generate-training");

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
          headerRight: isOwnSource
            ? () => (
                <Box flexDirection="row" alignItems="center" gap="s">
                  <HeaderIconButton
                    icon={IconSparkles}
                    onPress={openGenerateTraining}
                    accessibilityLabel={t(
                      "screens.home.generateTraining.title",
                    )}
                    testID="generate-training-header"
                  />
                  {showsHeaderImport && (
                    <HeaderIconButton
                      icon={IconCirclePlusFilled}
                      onPress={importCustomWorkout}
                      disabled={importing}
                      accessibilityLabel={t(
                        "screens.home.additionalTrainings.importTraining",
                      )}
                    />
                  )}
                </Box>
              )
            : undefined,
        }}
      />
      {isOwnSource ? (
        <OwnTrainingsList
          onGenerate={openGenerateTraining}
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
