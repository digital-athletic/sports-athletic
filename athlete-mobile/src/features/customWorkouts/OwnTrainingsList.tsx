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

type OwnTrainingsListProps = {
  onImport: () => void;
  importing: boolean;
};

const EmptyOwnTrainings: FC<OwnTrainingsListProps> = ({
  onImport,
  importing,
}) => {
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

export const OwnTrainingsList: FC<OwnTrainingsListProps> = ({
  onImport,
  importing,
}) => {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const deleteOwnCustomWorkout = useCustomWorkoutsStore(
    (state) => state.deleteOwnCustomWorkout,
  );
  const workouts = listWorkoutsForTeam(workoutsById, null);
  const deleteLabel = t("common.delete");

  if (workouts.length === 0) {
    return <EmptyOwnTrainings onImport={onImport} importing={importing} />;
  }

  const confirmDeleteTraining = (id: string, name: string) =>
    Alert.alert(
      t("screens.home.additionalTrainings.deleteTrainingTitle"),
      t("screens.home.additionalTrainings.deleteTrainingMessage", { name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: deleteLabel,
          style: "destructive",
          onPress: () => deleteOwnCustomWorkout(id),
        },
      ],
    );

  return (
    <ScrollBox
      flex={1}
      backgroundColor="white"
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
      </TileGrid>
    </ScrollBox>
  );
};
