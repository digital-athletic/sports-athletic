/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub with navigation to settings, profile, and account management.
 * Legacy: views/more/More
 */

import { useDeleteAccount, useLogout } from "@/auth/useAuthActions";
import { Ionicon } from "@/common/Ionicon";
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
        }}
      />
      <ScrollBox
        flex={1}
        backgroundColor="lightGrey2"
        contentContainerStyle={{ marginTop: 10 }}
      >
        {hasTestAccess && (
          <Box backgroundColor="white" marginBottom="s" paddingVertical="s">
            <ListItem
              title={t("more.testPersonas")}
              navPath="/test"
              iconName="help-circle"
              iconBackground="primary"
            />
            <ListItem
              title={t("more.trainingPlans")}
              navPath="/(tabs)/(more)/exercises"
              iconName="clipboard"
              iconBackground="primary"
            />
            <ListItem
              title={t("more.exercises")}
              navPath="/(tabs)/(more)/exercises"
              iconName="list"
              iconBackground="primary"
              isLast
            />
          </Box>
        )}

        <Box backgroundColor="white" marginBottom="s" paddingVertical="s">
          <ListItem
            title={t("more.myProfile")}
            navPath="/(more)/anamnesis/userprofile"
            iconName="person"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.mySport")}
            navPath="/(more)/anamnesis/sport"
            iconName="basketball"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.myEquipment")}
            navPath="/(tabs)/(more)/equipment"
            iconName="fitness"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.myTrainingData")}
            navPath="/(more)/anamnesis/season-phase"
            iconName="stats-chart"
            iconBackground="primary"
          />
          <StrengthTestMenuItems />
          <ListItem
            title={t("more.technicalVideos")}
            navPath="/(tabs)/(more)/tutorials"
            iconName="videocam"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.glossary.menuItem")}
            navPath="/(tabs)/(more)/glossary"
            iconName="book"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.joinTeam.menuItem")}
            navPath="/(tabs)/(more)/join-team"
            iconName="people"
            iconBackground="primary"
            isLast
          />
        </Box>

        <Box backgroundColor="white" paddingVertical="s">
          <InfoMenuItems />

          <Box>
            <TouchableOpacity onPress={deleteAccount}>
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
                    backgroundColor="darkGrey1"
                  >
                    <Ionicon
                      name="trash"
                      size={iconSize}
                      color={colors.white}
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

          <TouchableOpacity onPress={logout}>
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
                  backgroundColor="darkGrey1"
                >
                  <Ionicon
                    name="exit"
                    size={iconSize}
                    color={colors.white}
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
            backgroundColor="black"
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
