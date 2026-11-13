/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub with navigation to settings, profile, and account management.
 * Legacy: views/more/More
 */

import { useDeleteAccount, useLogout } from "@/auth/useAuthActions";
import { AppIcon } from "@/common/AppIcon";
import { ListDivider } from "@/common/ListDivider";
import { InfoMenuItems } from "@/features/more/InfoMenuItems";
import { ListItem } from "@/features/more/ListItem";
import { StrengthTestMenuItems } from "@/features/more/StrengthTestMenuItems";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import IconChalkboardTeacher from "@tabler/icons-react-native/IconChalkboardTeacher";
import IconChartBar from "@tabler/icons-react-native/IconChartBar";
import IconUsersGroup from "@tabler/icons-react-native/IconUsersGroup";
import IconBallBasketball from "@tabler/icons-react-native/IconBallBasketball";
import IconBook from "@tabler/icons-react-native/IconBook";
import IconHeartbeat from "@tabler/icons-react-native/IconHeartbeat";
import IconHelpCircle from "@tabler/icons-react-native/IconHelpCircle";
import IconLogout from "@tabler/icons-react-native/IconLogout";
import IconTrash from "@tabler/icons-react-native/IconTrash";
import IconUser from "@tabler/icons-react-native/IconUser";

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const iconContainerSize = useResponsiveProp({ phone: 30, tablet: 38 });
  const iconSize = useResponsiveProp({ phone: 16, tablet: 28 });
  const listItemHeight = useResponsiveProp({ phone: 40, tablet: 65 });
  const listItemMarginBottom = useResponsiveProp({ phone: 6, tablet: 16 });

  const { logout, isLoading: isLoggingOut } = useLogout();
  const { deleteAccount, isLoading: isDeleting } = useDeleteAccount();

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
      <ScrollBox
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
            isLast
          />
        </Box>

        {/* Separates the account actions from the menu above. */}
        <Box height={10} backgroundColor="surfaceContainerHigh" />

        <Box backgroundColor="surface" paddingVertical="s">
          <InfoMenuItems />

          <Box>
            <TouchableOpacity
              onPress={deleteAccount}
              accessibilityRole="button"
            >
              <Box
                justifyContent="center"
                alignSelf="stretch"
                paddingHorizontal="l"
                flexDirection="row"
                alignItems="center"
                style={{
                  minHeight: listItemHeight,
                  marginBottom: listItemMarginBottom,
                }}
              >
                <Box flex={1}>
                  <Box
                    width={iconContainerSize}
                    height={iconContainerSize}
                    borderRadius="round"
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor="onSurfaceVariant"
                  >
                    <AppIcon
                      icon={IconTrash}
                      size={iconSize}
                      color={colors.surface}
                      decorative
                    />
                  </Box>
                </Box>
                <Text flex={5} variant="body">
                  {t("more.deleteUser")}
                </Text>
              </Box>
            </TouchableOpacity>
            <ListDivider />
          </Box>

          <TouchableOpacity onPress={logout} accessibilityRole="button">
            <Box
              justifyContent="center"
              alignSelf="stretch"
              paddingHorizontal="l"
              flexDirection="row"
              alignItems="center"
              style={{ minHeight: listItemHeight, marginBottom: 15 }}
            >
              <Box flex={1}>
                <Box
                  width={iconContainerSize}
                  height={iconContainerSize}
                  borderRadius="round"
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor="onSurfaceVariant"
                >
                  <AppIcon
                    icon={IconLogout}
                    size={iconSize}
                    color={colors.surface}
                    decorative
                  />
                </Box>
              </Box>
              <Text flex={5} variant="body">
                {t("more.logout")}
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>

        {(isLoggingOut || isDeleting) && (
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
              {isDeleting ? t("more.deletingAccount") : t("more.loggingOut")}
            </Text>
          </Box>
        )}
      </ScrollBox>
    </>
  );
}
