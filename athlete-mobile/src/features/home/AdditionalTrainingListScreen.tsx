import { HeadlineScreen } from "@/common/HeadlineScreen";
import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Ionicon } from "@/common/Ionicon";
import { TileGrid } from "@/common/TileGrid";
import { Logger } from "@/services/Logger";
import { type UserTeam, getUserTeams } from "@/services/TeamService";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import IconBarbell from "@tabler/icons-react-native/IconBarbell";
import IconUsersGroup from "@tabler/icons-react-native/IconUsersGroup";

type TrainingSourceCardProps = {
  title: string;
  icon: AppIconSource;
  onPress: () => void;
};

/** Card in the style of the body part cards, with an icon above the name. */
const TrainingSourceCard: FC<TrainingSourceCardProps> = ({
  title,
  icon,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Card variant="outlined" flex={1} overflow="hidden">
        <Box
          backgroundColor="lightGrey1"
          alignItems="center"
          justifyContent="center"
          height={112}
        >
          <AppIcon icon={icon} size={48} color={colors.primary} decorative />
        </Box>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="m"
          paddingVertical="m"
          gap="xs"
        >
          <Text variant="body" fontSize={15} fontWeight="700" flexShrink={1}>
            {title}
          </Text>
          <Ionicon
            name="chevron-forward"
            size={14}
            color={colors.lightGrey3}
            decorative
          />
        </Box>
      </Card>
    </Pressable>
  );
};

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
          <TrainingSourceCard
            icon={IconBarbell}
            title={ownTrainingsTitle}
            onPress={() => openWorkouts(ownTrainingsTitle, "own")}
          />
          {teams.map((team) => (
            <TrainingSourceCard
              key={team.id}
              icon={IconUsersGroup}
              title={team.name}
              onPress={() => openWorkouts(team.name, "team")}
            />
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

const styles = StyleSheet.create({
  card: {
    width: "48%",
  },
  pressed: {
    opacity: 0.7,
  },
});
