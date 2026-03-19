/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub with navigation to settings, profile, and account management.
 * Legacy: views/more/More
 */

import { useDeleteAccount, useLogout } from "@/auth/useAuthActions";
import { Ionicon } from "@/common/Ionicon";
import { featureFlags } from "@/config/featureFlags";
import { ListDivider } from "@/common/ListDivider";
import { ListItem } from "@/features/more/ListItem";
import {
  getTestPeriodDaysLeft,
  isAllowedForTraining,
} from "@/features/subscription/subscriptionHelpers";
import { useSubscriptionStore } from "@/features/subscription/subscriptionStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { useResponsiveProp } from "@shopify/restyle";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity } from "react-native";

export default function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const iconContainerSize = useResponsiveProp({ phone: 30, tablet: 38 });
  const iconSize = useResponsiveProp({ phone: 16, tablet: 28 });
  const listItemHeight = useResponsiveProp({ phone: 40, tablet: 65 });
  const listItemMarginBottom = useResponsiveProp({ phone: 6, tablet: 16 });

  const { logout, isLoading: isLoggingOut } = useLogout();
  const { deleteAccount, isLoading: isDeleting } = useDeleteAccount();

  const subscription = useSubscriptionStore((state) => state.subscription);

  const daysLeft = getTestPeriodDaysLeft(subscription.firstRegistration);
  const allowedForTraining = isAllowedForTraining(subscription);

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
        {!subscription.isSubscribed && (
          <Box backgroundColor="white" marginBottom="s" padding="l">
            <Button
              variant="primary"
              onPress={() =>
                router.navigate({
                  pathname: "/(tabs)/(more)/subscribe",
                  params: { backPath: "More" },
                })
              }
            >
              <Text variant="button" color="white">
                {t("more.showSubscriptionOptions")}
              </Text>
            </Button>
            {Platform.OS !== "ios" && (
              <Text variant="body" marginTop="m" textAlign="center">
                {daysLeft > 0
                  ? t("more.stillXDaysForFree", { count: daysLeft })
                  : t("more.testPeriodExpired")}
              </Text>
            )}
          </Box>
        )}

        {hasTestAccess && (
          <Box backgroundColor="white" marginBottom="s" paddingVertical="s">
            <ListItem
              title={t("more.testPersonas")}
              navPath="/test"
              iconName="help-circle"
              iconBackground="primary"
              isSubscribed={allowedForTraining}
            />
            <ListItem
              title={t("more.trainingPlans")}
              navPath="/(tabs)/(more)/exercises"
              iconName="clipboard"
              iconBackground="primary"
              isSubscribed={allowedForTraining}
            />
            <ListItem
              title={t("more.exercises")}
              navPath="/(tabs)/(more)/exercises"
              iconName="list"
              iconBackground="primary"
              isLast
              isSubscribed={allowedForTraining}
            />
          </Box>
        )}

        <Box backgroundColor="white" marginBottom="s" paddingVertical="s">
          <ListItem
            title={t("more.myProfile")}
            navPath="/(more)/anamnesis/userprofile"
            iconName="person"
            iconBackground="primary"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.mySport")}
            navPath="/(more)/anamnesis/sport"
            iconName="basketball"
            iconBackground="primary"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.myEquipment")}
            navPath="/(tabs)/(more)/equipment"
            iconName="fitness"
            iconBackground="primary"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.myTrainingData")}
            navPath="/(more)/anamnesis/season-phase"
            iconName="stats-chart"
            iconBackground="primary"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.startNewTestWorkout")}
            navPath="/training/muscle-soreness"
            navParams={{
              type: "TEST_WORKOUT",
              originPath: "/(tabs)/(more)/more",
            }}
            iconName="barbell"
            iconBackground="primary"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.enterTestManually")}
            navPath="/training/manual-strength-test"
            iconName="create"
            iconBackground="primary"
          />
          <ListItem
            title={t("more.technicalVideos")}
            navPath="/(tabs)/(more)/tutorials"
            iconName="videocam"
            iconBackground="primary"
            isLast
            isSubscribed={allowedForTraining}
          />
        </Box>

        <Box backgroundColor="white" paddingVertical="s">
          {featureFlags.termsEnabled && (
            <ListItem
              title={t("more.agb")}
              navPath="/webview"
              iconName="information-circle"
              iconBackground="darkGrey1"
              isSubscribed={allowedForTraining}
            />
          )}
          {featureFlags.privacyEnabled && (
            <ListItem
              title={t("more.privacy")}
              navPath="/(tabs)/(more)/privacy"
              iconName="shield-checkmark"
              iconBackground="darkGrey1"
              isSubscribed={allowedForTraining}
            />
          )}
          <ListItem
            title={t("more.notificationsSettings")}
            navPath="/(tabs)/(more)/notifications"
            iconName="settings"
            iconBackground="darkGrey1"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.subscriptionStatus")}
            navPath="/(tabs)/(more)/subscription-status"
            iconName="eye"
            iconBackground="darkGrey1"
            isSubscribed={allowedForTraining}
          />
          <ListItem
            title={t("more.contact")}
            navPath="/contact"
            iconName="mail"
            iconBackground="darkGrey1"
            isSubscribed={allowedForTraining}
          />
          {featureFlags.imprintEnabled && (
            <ListItem
              title={t("more.imprint")}
              navPath="/(tabs)/(more)/imprint"
              iconName="document-text"
              iconBackground="darkGrey1"
              isSubscribed={allowedForTraining}
            />
          )}

          <Box>
            <TouchableOpacity onPress={deleteAccount}>
              <Box
                justifyContent="center"
                alignSelf="stretch"
                paddingHorizontal="l"
                flexDirection="row"
                alignItems="center"
                style={{
                  height: listItemHeight,
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
                      accessibilityLabel={t("common.altText.icon", {
                        title: t("more.deleteUser"),
                      })}
                    />
                  </Box>
                </Box>
                <Text flex={5} variant="body" numberOfLines={1}>
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
              style={{ height: listItemHeight, marginBottom: 15 }}
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
                    accessibilityLabel={t("common.altText.icon", {
                      title: t("more.logout"),
                    })}
                  />
                </Box>
              </Box>
              <Text flex={5} variant="body" numberOfLines={1}>
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
