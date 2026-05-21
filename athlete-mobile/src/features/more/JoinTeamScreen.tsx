import { useState, useEffect } from "react";
import { ActivityIndicator, StyleSheet, TextInput } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { type I18nKey } from "@/i18n";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { Button } from "@/theme/Button";
import { useTheme } from "@/theme/theme";
import { Alert } from "@/common/Alert";
import { ListDivider } from "@/common/ListDivider";
import { Logger } from "@/services/Logger";
import {
  type UserTeam,
  getUserTeams,
  acceptInvitation,
  leaveTeam,
} from "@/services/TeamService";

function errorKeyFrom(err: unknown): I18nKey {
  return err instanceof Error
    ? (err.message as I18nKey)
    : "more.joinTeam.errorGeneric";
}

export default function JoinTeamScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuthStore((s) => s.auth);
  const userId = auth?.userId ?? "";

  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const [leaveErrorKey, setLeaveErrorKey] = useState<I18nKey | null>(null);
  const [code, setCode] = useState("");
  const [joinState, setJoinState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; teamName: string }
    | { status: "error"; errorKey: I18nKey }
  >({ status: "idle" });

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

  const handleLeave = (teamId: string, teamName: string) => {
    Alert.alert(
      t("more.joinTeam.leaveConfirmTitle"),
      t("more.joinTeam.leaveConfirmMessage", { teamName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("more.joinTeam.leaveConfirmButton"),
          style: "destructive",
          onPress: async () => {
            setLeavingTeamId(teamId);
            setLeaveErrorKey(null);
            try {
              await leaveTeam(teamId);
              setTeams((prev) => prev.filter((team) => team.id !== teamId));
            } catch (err) {
              setLeaveErrorKey(errorKeyFrom(err));
            } finally {
              setLeavingTeamId(null);
            }
          },
        },
      ],
    );
  };

  const handleJoin = async () => {
    setJoinState({ status: "loading" });
    try {
      const result = await acceptInvitation(code);
      setJoinState({ status: "success", teamName: result.teamName });
      setTeams((prev) =>
        prev.some((team) => team.id === result.teamId)
          ? prev
          : [
              ...prev,
              { id: result.teamId, name: result.teamName, ownerId: "" },
            ],
      );
      setCode("");
    } catch (err) {
      setJoinState({ status: "error", errorKey: errorKeyFrom(err) });
    }
  };

  const isSubmitDisabled = code.length !== 6 || joinState.status === "loading";

  return (
    <>
      <Stack.Screen options={{ title: t("more.joinTeam.title") }} />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey2"
        contentContainerStyle={{ padding: 20 }}
      >
        <Box
          backgroundColor="white"
          borderRadius="l"
          padding="l"
          marginBottom="m"
        >
          <Text variant="sectionTitle">{t("more.joinTeam.yourTeams")}</Text>
          {teamsLoading ? (
            <ActivityIndicator testID="teams-loading-indicator" />
          ) : teams.length === 0 ? (
            <Text variant="subtitle">{t("more.joinTeam.noTeams")}</Text>
          ) : (
            teams.map((team, index) => (
              <Box key={team.id}>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  paddingVertical="s"
                >
                  <Text variant="body" flex={1}>
                    {team.name}
                  </Text>
                  {team.ownerId !== userId && (
                    <Button
                      variant="secondary"
                      onPress={() => handleLeave(team.id, team.name)}
                      disabled={leavingTeamId === team.id}
                      paddingVertical="xs"
                      paddingHorizontal="m"
                      style={{
                        opacity: leavingTeamId === team.id ? 0.5 : 1,
                      }}
                    >
                      {t("more.joinTeam.leave")}
                    </Button>
                  )}
                </Box>
                {index < teams.length - 1 && <ListDivider />}
              </Box>
            ))
          )}
          {leaveErrorKey !== null && (
            <Text variant="small" color="error" marginTop="s">
              {t(leaveErrorKey)}
            </Text>
          )}
        </Box>

        <Box backgroundColor="white" borderRadius="l" padding="l">
          <Text variant="sectionTitle">{t("more.joinTeam.joinSection")}</Text>
          <Text variant="label" marginBottom="xs">
            {t("more.joinTeam.codeLabel")}
          </Text>
          <TextInput
            testID="invite-code-input"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            maxLength={6}
            placeholder={t("more.joinTeam.codePlaceholder")}
            autoCapitalize="characters"
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.lightGrey2,
                color: colors.darkGrey3,
                borderColor: colors.lightGrey2,
              },
            ]}
          />
          <Button
            onPress={handleJoin}
            disabled={isSubmitDisabled}
            style={{ opacity: isSubmitDisabled ? 0.5 : 1 }}
          >
            {t("more.joinTeam.submit")}
          </Button>
          {joinState.status === "success" && (
            <Text
              variant="body"
              color="success"
              textAlign="center"
              marginTop="m"
            >
              {t("more.joinTeam.successMessage", {
                teamName: joinState.teamName,
              })}
            </Text>
          )}
          {joinState.status === "error" && (
            <Text
              variant="small"
              color="error"
              textAlign="center"
              marginTop="s"
            >
              {t(joinState.errorKey)}
            </Text>
          )}
        </Box>
      </ScrollBox>
    </>
  );
}

const styles = StyleSheet.create({
  codeInput: {
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "Courier New",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
});
