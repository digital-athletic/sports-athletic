import { Alert } from "@/common/Alert";
import { readLocalizedTemplateName } from "@/data/loadTemplates";
import { CustomWorkoutRow } from "@/features/customWorkouts/CustomWorkoutRow";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
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
      backgroundColor="lightGrey1"
      contentInsetAdjustmentBehavior="automatic"
      testID="own-trainings-list"
    >
      {workouts.map((workout) => {
        const name = readLocalizedTemplateName(
          workout.template.name,
          i18n.language,
        );
        return (
          <CustomWorkoutRow
            key={workout.id}
            workoutId={workout.id}
            name={name}
            deleteAction={{
              label: deleteLabel,
              onDelete: () => confirmDeleteTraining(workout.id, name),
            }}
          />
        );
      })}
    </ScrollBox>
  );
};
