/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub with navigation to settings, profile, and account management.
 * Legacy: views/more/More
 */

import { useLogout } from "@/auth/useAuthActions";
import { ColumnScrollBox } from "@/common/ColumnScrollBox";
import { featureFlags } from "@/config/featureFlags";
import { InfoMenuItems } from "@/features/more/InfoMenuItems";
import { ListItem } from "@/features/more/ListItem";
import { StrengthTestMenuItems } from "@/features/more/StrengthTestMenuItems";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import IconChalkboardTeacher from "@tabler/icons-react-native/IconChalkboardTeacher";
import IconChartBar from "@tabler/icons-react-native/IconChartBar";
import IconUsersGroup from "@tabler/icons-react-native/IconUsersGroup";
import IconBallBasketball from "@tabler/icons-react-native/IconBallBasketball";
import IconBook from "@tabler/icons-react-native/IconBook";
import IconHeartbeat from "@tabler/icons-react-native/IconHeartbeat";
import IconHelpCircle from "@tabler/icons-react-native/IconHelpCircle";
import IconLogout from "@tabler/icons-react-native/IconLogout";
import IconStopwatch from "@tabler/icons-react-native/IconStopwatch";
import IconUser from "@tabler/icons-react-native/IconUser";
import IconUserCog from "@tabler/icons-react-native/IconUserCog";

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { logout, isLoading: isLoggingOut } = useLogout();

  // Check if user has test access
  const hasTestAccess = false;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("screens.more.title"),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
        }}
      />
      <ColumnScrollBox
        flex={1}
        backgroundColor="surface"
        contentInsetAdjustmentBehavior="automatic"
      >
        {hasTestAccess && (
          <Box backgroundColor="surface" paddingVertical="s">
            <ListItem
              title={t("more.testPersonas")}
              navPath="/test"
              icon={IconHelpCircle}
              iconBackground="primary"
              isLast
            />
          </Box>
        )}

        <Box backgroundColor="surface" paddingVertical="s">
          <ListItem
            title={t("more.myProfile")}
            navPath="/(more)/anamnesis/userprofile"
            icon={IconUser}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.mySport")}
            navPath="/(more)/anamnesis/sport"
            icon={IconBallBasketball}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.myEquipment")}
            navPath="/(tabs)/(more)/equipment"
            icon={IconHeartbeat}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.myTrainingData")}
            navPath="/(more)/anamnesis/season-phase"
            icon={IconChartBar}
            iconBackground="primary"
          />
          <StrengthTestMenuItems />
          {featureFlags.performanceTestsEnabled && (
            <ListItem
              title={t("more.performanceTests.menuItem")}
              navPath="/(tabs)/(more)/performance-tests"
              icon={IconStopwatch}
              iconBackground="primary"
            />
          )}
          <ListItem
            title={t("more.introductionVideos")}
            navPath="/(tabs)/(more)/tutorials"
            icon={IconChalkboardTeacher}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.glossary.menuItem")}
            navPath="/(tabs)/(more)/glossary"
            icon={IconBook}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.joinTeam.menuItem")}
            navPath="/(tabs)/(more)/join-team"
            icon={IconUsersGroup}
            iconBackground="primary"
          />
          <ListItem
            title={t("more.account.menuItem")}
            navPath="/(tabs)/(more)/account"
            icon={IconUserCog}
            iconBackground="primary"
            isLast
          />
        </Box>

        {/* Separates the account actions from the menu above. */}
        <Box height={10} backgroundColor="surfaceContainerHigh" />

        <Box backgroundColor="surface" paddingVertical="s">
          <InfoMenuItems />

          <ListItem
            title={t("more.logout")}
            icon={IconLogout}
            iconBackground="onSurfaceVariant"
            onPress={logout}
            isLast
          />
        </Box>

        {isLoggingOut && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="scrim"
            opacity={0.5}
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="title" color="white">
              {t("more.loggingOut")}
            </Text>
          </Box>
        )}
      </ColumnScrollBox>
    </>
  );
}
