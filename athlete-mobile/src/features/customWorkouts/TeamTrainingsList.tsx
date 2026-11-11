import { readLocalizedTemplateName } from "@/data/loadTemplates";
import { CustomWorkoutRow } from "@/features/customWorkouts/CustomWorkoutRow";
import { EmptyTrainingListMessage } from "@/features/customWorkouts/EmptyTrainingListMessage";
import {
  listWorkoutsForTeam,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import {
  syncTeamWorkouts,
  type TeamWorkoutsSyncResult,
} from "./syncTeamWorkouts";

type TeamTrainingsListProps = {
  teamId: string;
};

const OfflineNote: FC = () => {
  const { t } = useTranslation();

  return (
    <Box backgroundColor="lightGrey1" paddingHorizontal="m" paddingTop="m">
      <Text variant="body" color="darkGrey1" accessibilityRole="text">
        {t("screens.home.additionalTrainings.offlineNote")}
      </Text>
    </Box>
  );
};

/**
 * The team's workouts from the device, synced on mount, i.e. on every tap on
 * the team tile; callers key the list by team id. Athletes cannot delete them.
 */
export const TeamTrainingsList: FC<TeamTrainingsListProps> = ({ teamId }) => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<"loading" | TeamWorkoutsSyncResult>(
    "loading",
  );
  useEffect(() => {
    let cancelled = false;
    void syncTeamWorkouts(teamId).then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId]);
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const workouts = listWorkoutsForTeam(workoutsById, teamId);

  if (status === "loading") {
    return (
      <Box
        flex={1}
        backgroundColor="lightGrey1"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator
          accessibilityLabel={t(
            "screens.home.additionalTrainings.loadingTrainings",
          )}
        />
      </Box>
    );
  }

  const offlineNote = status === "offline" ? <OfflineNote /> : null;

  if (workouts.length === 0) {
    return (
      <>
        {offlineNote}
        <EmptyTrainingListMessage />
      </>
    );
  }

  return (
    <ScrollBox
      flex={1}
      backgroundColor="lightGrey1"
      contentInsetAdjustmentBehavior="automatic"
      testID="team-trainings-list"
    >
      {offlineNote}
      {workouts.map((workout) => (
        <CustomWorkoutRow
          key={workout.id}
          workoutId={workout.id}
          name={readLocalizedTemplateName(workout.template.name, i18n.language)}
        />
      ))}
    </ScrollBox>
  );
};
