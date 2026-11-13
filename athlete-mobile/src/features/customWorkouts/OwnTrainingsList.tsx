import { AddTileCard } from "@/common/AddTileCard";
import { Alert } from "@/common/Alert";
import { TileGrid } from "@/common/TileGrid";
import { readLocalizedTemplateName } from "@/data/loadTemplates";
import { CustomWorkoutTile } from "@/features/customWorkouts/CustomWorkoutTile";
import { detectCustomWorkoutFocus } from "@/features/customWorkouts/customWorkoutFocus";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type OwnTrainingsListProps = {
  onGenerate: () => void;
  onImport: () => void;
  importing: boolean;
};

/** Empty list: the message with the two ways to add a training. */
const EmptyOwnTrainings: FC<OwnTrainingsListProps> = ({
  onGenerate,
  onImport,
  importing,
}) => {
  const { t } = useTranslation();
  const generateLabel = t("screens.home.generateTraining.title");
  const importLabel = t("screens.home.additionalTrainings.importTraining");

  return (
    <EmptyTrainingListMessage>
      <Box alignSelf="stretch" gap="s" marginTop="l">
        <Button
          variant="cta"
          onPress={onGenerate}
          accessibilityLabel={generateLabel}
        >
          {generateLabel}
        </Button>
        <Button
          variant="ctaOutline"
          onPress={onImport}
          disabled={importing}
          accessibilityState={{ disabled: importing }}
          accessibilityLabel={importLabel}
        >
          {importLabel}
        </Button>
      </Box>
    </EmptyTrainingListMessage>
  );
};

/** Asks for confirmation, then deletes the own training. */
const useConfirmDeleteTraining = () => {
  const { t } = useTranslation();
  const deleteOwnCustomWorkout = useCustomWorkoutsStore(
    (state) => state.deleteOwnCustomWorkout,
  );

  return (id: string, name: string) =>
    Alert.alert(
      t("screens.home.additionalTrainings.deleteTrainingTitle"),
      t("screens.home.additionalTrainings.deleteTrainingMessage", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteOwnCustomWorkout(id),
        },
      ],
    );
};

export const OwnTrainingsList: FC<OwnTrainingsListProps> = ({
  onGenerate,
  onImport,
  importing,
}) => {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const confirmDeleteTraining = useConfirmDeleteTraining();
  const workouts = listWorkoutsForTeam(workoutsById, null);

  if (workouts.length === 0) {
    return (
      <EmptyOwnTrainings
        onGenerate={onGenerate}
        onImport={onImport}
        importing={importing}
      />
    );
  }

  return (
    <ScrollBox
      flex={1}
      backgroundColor="surface"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.l }}
      testID="own-trainings-list"
    >
      <TileGrid testID="own-trainings-grid">
        {workouts.map((workout) => {
          const name = readLocalizedTemplateName(
            workout.template.name,
            i18n.language,
          );
          return (
            <CustomWorkoutTile
              key={workout.id}
              workoutId={workout.id}
              focus={detectCustomWorkoutFocus(workout.template)}
              name={name}
              deleteAction={{
                label: t("screens.home.additionalTrainings.deleteTraining", {
                  name,
                }),
                onDelete: () => confirmDeleteTraining(workout.id, name),
              }}
            />
          );
        })}
        <AddTileCard
          label={t("screens.home.generateTraining.title")}
          onPress={onGenerate}
          testID="generate-training-tile"
        />
      </TileGrid>
    </ScrollBox>
  );
};
