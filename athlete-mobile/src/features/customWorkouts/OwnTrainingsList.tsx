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
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { TouchableBox } from "@/theme/TouchableBox";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type ImportProps = {
  onImport: () => void;
  importing: boolean;
};

type OwnTrainingsListProps = ImportProps & {
  onGenerate: () => void;
};

const EmptyOwnTrainings: FC<ImportProps> = ({ onImport, importing }) => {
  const { t } = useTranslation();
  const importLabel = t("screens.home.additionalTrainings.importTraining");

  return (
    <EmptyTrainingListMessage>
      <TouchableBox
        onPress={onImport}
        disabled={importing}
        accessibilityState={{ disabled: importing }}
        marginTop="m"
        padding="s"
        accessibilityRole="button"
        accessibilityLabel={importLabel}
      >
        <Text variant="body" color="primary" textDecorationLine="underline">
          {importLabel}
        </Text>
      </TouchableBox>
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

  return (
    <ScrollBox
      flex={1}
      backgroundColor="white"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.l, gap: spacing.l }}
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
      {workouts.length === 0 && (
        <EmptyOwnTrainings onImport={onImport} importing={importing} />
      )}
    </ScrollBox>
  );
};
