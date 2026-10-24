import { Alert } from "@/common/Alert";
import { SwipeToDeleteRow } from "@/common/SwipeToDeleteRow";
import { readLocalizedTemplateName } from "@/data/loadTemplates";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import { ColumnListRow } from "@/features/training/ColumnListRow";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { router } from "expo-router";
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
    <ScrollBox flex={1} backgroundColor="lightGrey1">
      {workouts.map((workout) => {
        const name = readLocalizedTemplateName(
          workout.template.name,
          i18n.language,
        );
        return (
          <SwipeToDeleteRow
            key={workout.id}
            deleteLabel={deleteLabel}
            onDelete={() => confirmDeleteTraining(workout.id, name)}
          >
            <ColumnListRow
              title={name}
              onPress={() =>
                router.navigate({
                  pathname: "/training/muscle-soreness",
                  params: { type: workout.id },
                })
              }
              accessibilityActions={[{ name: "delete", label: deleteLabel }]}
              onAccessibilityAction={({ nativeEvent }) => {
                if (nativeEvent.actionName === "delete") {
                  confirmDeleteTraining(workout.id, name);
                }
              }}
            />
          </SwipeToDeleteRow>
        );
      })}
    </ScrollBox>
  );
};
