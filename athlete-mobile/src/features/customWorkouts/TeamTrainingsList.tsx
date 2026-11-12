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
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
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
    <Text variant="body" color="onSurfaceVariant" accessibilityRole="text">
      {t("screens.home.additionalTrainings.offlineNote")}
    </Text>
  );
};

/** Syncs the team's workouts on mount and reports how the sync ended. */
const useTeamWorkoutsSync = (
  teamId: string,
): "loading" | TeamWorkoutsSyncResult => {
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
  return status;
};

/**
 * The team's workouts from the device, synced on mount, i.e. on every tap on
 * the team tile; callers key the list by team id. Athletes cannot delete them.
 */
export const TeamTrainingsList: FC<TeamTrainingsListProps> = ({ teamId }) => {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const status = useTeamWorkoutsSync(teamId);
  const workoutsById = useCustomWorkoutsStore((state) => state.workoutsById);
  const workouts = listWorkoutsForTeam(workoutsById, teamId);

  if (status === "loading") {
    return (
      <Box
        flex={1}
        backgroundColor="surfaceContainerLow"
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

  const isOffline = status === "offline";

  if (workouts.length === 0) {
    return (
      <>
        {isOffline && (
          <Box
            backgroundColor="surfaceContainerLow"
            paddingHorizontal="m"
            paddingTop="m"
          >
            <OfflineNote />
          </Box>
        )}
        <EmptyTrainingListMessage />
      </>
    );
  }

  return (
    <ScrollBox
      flex={1}
      backgroundColor="surface"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: spacing.l, gap: spacing.m }}
      testID="team-trainings-list"
    >
      {isOffline && <OfflineNote />}
      <TileGrid testID="team-trainings-grid">
        {workouts.map((workout) => (
          <CustomWorkoutTile
            key={workout.id}
            workoutId={workout.id}
            isDraft={workout.isDraft}
            focus={detectCustomWorkoutFocus(workout.template)}
            name={readLocalizedTemplateName(
              workout.template.name,
              i18n.language,
            )}
          />
        ))}
      </TileGrid>
    </ScrollBox>
  );
};
