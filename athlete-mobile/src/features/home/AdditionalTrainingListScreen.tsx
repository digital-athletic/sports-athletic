import { HeadlineScreen } from "@/common/HeadlineScreen";
import { TileCard } from "@/common/TileCard";
import { TileGrid } from "@/common/TileGrid";
import { TileIcon } from "@/common/TileIcon";
import { Logger } from "@/services/Logger";
import { type UserTeam, getUserTeams } from "@/services/TeamService";
import { Box } from "@/theme/Box";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconUsersGroup from "@tabler/icons-react-native/IconUsersGroup";

export default function AdditionalTrainingListScreen() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUserTeams()
      .then((result) => {
        if (!cancelled) setTeams(result);
      })
      .catch((err: unknown) => {
        Logger.logError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openWorkouts = (title: string, source: "own" | "team") => {
    router.push({
      pathname: "/additional-training-workouts",
      params: { title, source },
    });
  };

  const ownTrainingsTitle = t("screens.home.additionalTrainings.ownTrainings");

  return (
    <HeadlineScreen
      title={t("screens.home.additionalTrainings.title")}
      heading={t("screens.home.additionalTrainings.title")}
      description={t("screens.home.additionalTrainings.subtitle")}
    >
      <Box gap="l">
        <TileGrid testID="additional-training-grid">
          <TileCard
            title={ownTrainingsTitle}
            onPress={() => openWorkouts(ownTrainingsTitle, "own")}
          >
            <TileIcon icon={IconBarbell} />
          </TileCard>
          {teams.map((team) => (
            <TileCard
              key={team.id}
              title={team.name}
              onPress={() => openWorkouts(team.name, "team")}
            >
              <TileIcon icon={IconUsersGroup} />
            </TileCard>
          ))}
        </TileGrid>
        {teamsLoading && (
          <ActivityIndicator
            accessibilityLabel={t(
              "screens.home.additionalTrainings.loadingTeams",
            )}
          />
        )}
      </Box>
    </HeadlineScreen>
  );
}
