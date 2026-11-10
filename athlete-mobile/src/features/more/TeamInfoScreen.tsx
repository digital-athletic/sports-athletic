import { ActivityIndicator } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { liveRegionProps } from "@/common/announce";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { type TeamInfo } from "@/services/TeamService";
import { useTeamInfo } from "./useTeamInfo";

/** Read-only page with the guidance and weekly target the team owner set. */
export default function TeamInfoScreen() {
  const { t } = useTranslation();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { state, reload } = useTeamInfo(teamId);

  return (
    <>
      <Stack.Screen options={{ title: t("more.teamInfo.title") }} />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey2"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20 }}
      >
        <Box backgroundColor="white" borderRadius="l" padding="l">
          {state.status === "loading" && (
            <ActivityIndicator
              testID="team-info-loading"
              accessibilityLabel={t("common.loading")}
            />
          )}

          {state.status === "error" && (
            <>
              <Text
                variant="body"
                color="error"
                marginBottom="m"
                accessibilityRole="alert"
                {...liveRegionProps}
              >
                {t("more.teamInfo.loadError")}
              </Text>
              <Button testID="team-info-retry" onPress={reload}>
                {t("more.teamInfo.retry")}
              </Button>
            </>
          )}

          {state.status === "notMember" && (
            <Text variant="body" accessibilityRole="alert" {...liveRegionProps}>
              {t("more.teamInfo.notMember")}
            </Text>
          )}

          {state.status === "loaded" && <TeamInfoContent team={state.team} />}
        </Box>
      </ScrollBox>
    </>
  );
}

function TeamInfoContent({ team }: { team: TeamInfo }) {
  const { t } = useTranslation();
  const hasNothing = team.guidance === null && team.weeklyTrainingDays === null;

  return (
    <>
      <Text variant="title" accessibilityRole="header" marginBottom="m">
        {team.name}
      </Text>

      {team.weeklyTrainingDays !== null && (
        <Box marginBottom="m">
          <Text variant="label" marginBottom="xs">
            {t("more.teamInfo.weeklyTargetTitle")}
          </Text>
          <Text variant="body" testID="team-info-weekly-target">
            {t("more.teamInfo.weeklyTarget", {
              count: team.weeklyTrainingDays,
            })}
          </Text>
        </Box>
      )}

      {team.guidance !== null && (
        <Box>
          <Text variant="label" marginBottom="xs">
            {t("more.teamInfo.guidanceTitle")}
          </Text>
          <Text variant="body" testID="team-info-guidance">
            {team.guidance}
          </Text>
        </Box>
      )}

      {hasNothing && (
        <Text variant="subtitle">{t("more.teamInfo.noGuidance")}</Text>
      )}
    </>
  );
}
