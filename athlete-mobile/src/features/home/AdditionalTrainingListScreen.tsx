import { Logger } from "@/services/Logger";
import { type UserTeam, getUserTeams } from "@/services/TeamService";
import { ScrollBox } from "@/theme/ScrollBox";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";
import { ColumnListRow } from "@/features/training/ColumnListRow";

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
    <>
      <Stack.Screen
        options={{
          title: t("screens.home.additionalTrainings.title"),
          headerShown: true,
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey1"
        contentInsetAdjustmentBehavior="automatic"
        testID="additional-training-list"
      >
        <ColumnListRow
          title={ownTrainingsTitle}
          onPress={() => openWorkouts(ownTrainingsTitle, "own")}
        />
        {teamsLoading && (
          <ActivityIndicator
            accessibilityLabel={t(
              "screens.home.additionalTrainings.loadingTeams",
            )}
          />
        )}
        {teams.map((team) => (
          <ColumnListRow
            key={team.id}
            title={team.name}
            onPress={() => openWorkouts(team.name, "team")}
          />
        ))}
      </ScrollBox>
    </>
  );
}
