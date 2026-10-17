import { SwitchInputField } from "@/form/SwitchInputField";
import { AsyncStorageService } from "@/services/AsyncStorageService";
import { PushNotificationService } from "@/services/PushNotificationService";
import { useAuthStore } from "@/store/authStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * NotificationsScreen Component
 *
 * Manages notification preferences and system permission settings.
 * Shows toggle for app-level notifications and guides user to system settings if needed.
 * Legacy: views/more/pages/Notifications
 */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { auth } = useAuthStore();
  const userId = auth?.userId;
  const { trainingPlan } = useUserWorkoutStore();

  const [notificationsAllowedApp, setNotificationsAllowedApp] = useState(true);
  const [notificationsAllowedOS, setNotificationsAllowedOS] = useState(true);

  // Service instances - memoized to avoid recreating on every render
  const asyncStorageService = useMemo(() => new AsyncStorageService(), []);
  const pushNotificationService = useMemo(
    () => new PushNotificationService(),
    [],
  );

  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!userId) return;

      const [appAllowed, osAllowed] = await Promise.all([
        asyncStorageService.getAllowNotifications(userId),
        pushNotificationService.systemAllowsNotifications(),
      ]);

      setNotificationsAllowedApp(appAllowed);
      setNotificationsAllowedOS(osAllowed);
    };

    loadNotificationSettings();
  }, [userId, asyncStorageService, pushNotificationService]);

  const handleToggleNotifications = useCallback(
    async (newValue: boolean) => {
      if (!userId) return;

      setNotificationsAllowedApp(newValue);

      await asyncStorageService.setAllowNotifications(newValue, userId);

      if (newValue && trainingPlan) {
        pushNotificationService.createWorkoutRemindersFromTrainingPlan(
          trainingPlan,
        );
      } else {
        pushNotificationService.cancelAllWorkoutReminderNotifications();
      }
    },
    [userId, trainingPlan, asyncStorageService, pushNotificationService],
  );

  const handleOpenSettings = useCallback(async () => {
    if (!userId) return;

    pushNotificationService.openSystemNotificationSettings();

    await asyncStorageService.setAllowNotifications(true, userId);

    if (trainingPlan) {
      pushNotificationService.createWorkoutRemindersFromTrainingPlan(
        trainingPlan,
      );
    }

    router.back();
  }, [
    userId,
    trainingPlan,
    router,
    asyncStorageService,
    pushNotificationService,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t("more.notifications.settings"),
        }}
      />
      <Box flex={1}>
        {notificationsAllowedOS ? (
          <Box flex={1} paddingHorizontal="l">
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              minHeight={56}
            >
              <Text variant="sectionTitle" color="darkGrey3">
                {t("more.notifications.settingsTitle")}
              </Text>
              <SwitchInputField
                value={notificationsAllowedApp}
                descriptionText=""
                accessibilityLabel={t("more.notifications.settingsTitle")}
                onChange={handleToggleNotifications}
                size="small"
                color={colors.settingsSwitchGreen}
                thumbColor={colors.white}
              />
            </Box>
            <Text variant="body" color="darkGrey3">
              {t("more.notifications.settingsText")}
            </Text>
          </Box>
        ) : (
          <Box flex={1} paddingHorizontal="l">
            <Box minHeight={56} justifyContent="center">
              <Text variant="sectionTitle" color="darkGrey3">
                {t("more.notifications.systemSettingsTitle")}
              </Text>
            </Box>
            <Text variant="body" color="darkGrey3" marginBottom="l">
              {t("more.notifications.systemSettingsText")}
            </Text>
            <Button variant="primary" onPress={handleOpenSettings}>
              <Text variant="button" color="white">
                {t("more.notifications.systemSettingsButtonText")}
              </Text>
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}
